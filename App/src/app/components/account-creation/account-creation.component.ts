import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { AccountService } from '../../services/account.service';
import { User } from '../../models/user.model';
import { NewBankAccount } from '../../models/new-bank-account.model';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {ActivatedRoute, Router} from '@angular/router';
// import {NgForOf, NgIf} from '@angular/common';

@Component({
  selector: 'app-account-creation',
  templateUrl: './account-creation.component.html',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule
    // NgForOf,
    // NgIf
  ],
  styleUrls: ['./account-creation.component.css']
})
export class AccountCreationComponent implements OnInit {
  users: User[] = [];
  companies = [
    { id: 1, name: 'Company One' },
    { id: 2, name: 'Company Two' },
    { id: 3, name: 'Company Three' }
  ];
  isCurrentAccount = true;
  isCompanyAccount = false;
  employeeId: number | null = null;
  availableCurrencies: string[] = ['RSD'];

  newAccount: NewBankAccount = {
    currency: '',
    clientId: 0,
    employeeId: 0,
    initialBalance: 0,
    dailyLimit: 0,
    monthlyLimit: 0,
    dailySpending: 0,
    monthlySpending: 0,
    isActive: 'INACTIVE',
    accountType: 'CURRENT',
    accountOwnerType: 'PERSONAL',
    createCard: false,
    monthlyFee: 0
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private accountService: AccountService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {

    const userType = this.authService.getUserType();
    const isAdmin = this.authService.isAdmin();

    if (userType !== 'employee' && !isAdmin) {
      alert("Access denied. Only employees and admins can create accounts.");
      this.router.navigate(['/']);
      return;
    }

    this.loadUsers();
    this.employeeId = this.authService.getUserId();
    if (this.employeeId) {
      this.newAccount.employeeId = this.employeeId;
    }
    this.route.queryParams.subscribe(params => {
      const userId = params['userId'];
      if (userId) {
        this.newAccount.clientId = +userId; // preselect
      }
    });
    // this.loadUsers();
    this.onAccountTypeChange();
  }

  navigateToRegisterUser() {
    this.router.navigate(['/register-user'], { queryParams: { redirect: 'account' } });
  }

  loadUsers() {
    this.userService.getAllUsers(0, 100).subscribe({
      next: (response) => {
        this.users = response.content;
      },
      error: (error) => console.error('Failed to load users:', error)
    });
  }

  onAccountTypeChange() {
    this.isCurrentAccount = this.newAccount.accountType === 'CURRENT';
    if (!this.isCurrentAccount) {
      this.newAccount.monthlyFee = 0;
      this.availableCurrencies = ['EUR', 'CHF', 'USD', 'GBP', 'JPY', 'CAD', 'AUD'];
      this.newAccount.currency = '';

    }else {
      this.availableCurrencies = ['RSD'];
      this.newAccount.currency = 'RSD';
    }
  }

  onAccountOwnerTypeChange() {
    this.isCompanyAccount = this.newAccount.accountOwnerType === 'COMPANY';
    if (!this.isCompanyAccount) {
      this.newAccount.companyId = undefined;
    }
  }

  toggleIsActive() {
    this.newAccount.isActive = this.newAccount.isActive === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
  }

  onSubmit() {
    if (!this.newAccount.clientId || !this.employeeId) return;

    this.accountService.createAccount(this.newAccount).subscribe({
      next: () => {
        console.log('Account created successfully!');
        alert("uspesno!");
      },
      error: (error) => {
        console.error('Failed to create account:', error);
        alert("EROR");
      }
    });
  }
}
