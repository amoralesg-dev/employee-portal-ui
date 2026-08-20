import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PermissionRequest, PermissionResponse } from '../../models/permiso.model';

@Component({
  selector: 'app-permiso-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './permiso-form.html'
})
export class PermisoForm implements OnInit {
  @Input() permission: PermissionResponse | null = null;
  @Output() save = new EventEmitter<PermissionRequest>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(255)]
    });
  }

  ngOnInit(): void {
    if (this.permission) {
      this.form.patchValue({
        code: this.permission.code,
        description: this.permission.description
      });
    }
  }

  guardar(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
