import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ApplicationDto } from '../../models/application.model';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    ButtonModule, 
    InputTextModule, 
    TextareaModule,
    ToggleSwitchModule
  ],
  templateUrl: './application-form.html',
  styleUrls: ['./application-form.scss']
})
export class ApplicationFormComponent implements OnInit {
  private fb = inject(FormBuilder);

  @Input() set application(val: ApplicationDto | null) {
    if (val) {
      this.form.patchValue(val);
    } else {
      this.form.reset({ active: true });
    }
  }

  @Output() save = new EventEmitter<ApplicationDto>();
  @Output() cancel = new EventEmitter<void>();

  form: FormGroup = this.fb.group({
    id: [null],
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    active: [true, Validators.required]
  });

  ngOnInit(): void {}

  guardar() {
    if (this.form.valid) {
      this.save.emit(this.form.value as ApplicationDto);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
