import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { PermissionRequest, PermissionResponse } from '../../models/permiso.model';
import { ApplicationService } from '../../../aplicaciones/services/application.service';
import { ApplicationDto } from '../../../aplicaciones/models/application.model';

@Component({
  selector: 'app-permiso-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule, SelectModule],
  templateUrl: './permiso-form.html'
})
export class PermisoForm implements OnInit {
  @Input() permission: PermissionResponse | null = null;
  @Output() save = new EventEmitter<PermissionRequest>();
  @Output() cancel = new EventEmitter<void>();

  private readonly applicationService = inject(ApplicationService);
  applications: ApplicationDto[] = [];
  form: FormGroup;

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.maxLength(255)],
      applicationId: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadApplications();
    if (this.permission) {
      this.form.patchValue({
        code: this.permission.code,
        description: this.permission.description,
        applicationId: this.permission.applicationId
      });
    }
  }

  loadApplications(): void {
    this.applicationService.getActiveApplications().subscribe(apps => {
      this.applications = apps;
    });
  }

  guardar(): void {
    if (this.form.valid) {
      this.save.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
