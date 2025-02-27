import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css'],
})
export class EditUserComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private alertService = inject(AlertService);

  userForm!: FormGroup;
  userId!: number;
  errorMessage: string | null = null;
  loading = true;

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'admin';
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam || isNaN(+idParam)) {
      this.errorMessage = 'Invalid user ID.';
      this.router.navigate(['/users']);
      return;
    }

    this.userId = +idParam;
    this.loadUser();
  }

  loadUser(): void {
    this.loading = true;
    this.userService.getUserById(this.userId).subscribe({
      next: (user) => {
        if (!user) {
          this.errorMessage = 'User not found.';
          this.router.navigate(['/users']);
          return;
        }
        this.initForm(user);
      },
      error: () => {
        this.errorMessage = 'Error loading user. Please try again.';
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }

  initForm(user: User): void {
    this.userForm = this.fb.group({
      firstName: [{ value: user.firstName, disabled: true }, Validators.required],
      lastName: [user.lastName, [Validators.required, Validators.minLength(2)]],
      birthDate: [{ value: this.formatDate(user.birthDate), disabled: true }, Validators.required],
      gender: [{ value: user.gender, disabled: true }, Validators.required],
      email: [{ value: user.email, disabled: true }, [Validators.required, Validators.email]],
      phone: [user.phone, [Validators.required, Validators.pattern(/^\+?[1-9][0-9]{6,14}$/)]],
      address: [user.address, [Validators.required, Validators.minLength(5)]],
    });
  }

  private formatDate(date?: Date): string {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  }

  saveChanges(): void {
    if (!this.isAdmin) {
      this.alertService.showAlert('error', 'Only admins can update user data.');
      return;
    }

    if (this.userForm.invalid) {
      this.alertService.showAlert('warning', 'Form is invalid. Please fix errors before saving.');
      this.userForm.markAllAsTouched();
      return;
    }

    const updatedUser: User = {
      id: this.userId,
      firstName: this.userForm.value.name,
      lastName: this.userForm.value.lastName,
      birthDate: this.userForm.value.birthDate,
      gender: this.userForm.value.gender,
      email: this.userForm.value.email,
      phone: this.userForm.value.phone,
      address: this.userForm.value.address,
    };

    this.userService.updateUser(updatedUser).subscribe({
      next: () => {
        this.alertService.showAlert('success', 'User updated successfully!');
        this.router.navigate(['/users']);
      },
      error: () => {
        this.alertService.showAlert('error', 'Failed to update user. Please try again.');
      },
    });
  }

  hasError(controlName: string, errorCode: string): boolean {
    const control = this.userForm?.get(controlName);
    return !!(control && control.touched && control.hasError(errorCode));
  }
}
