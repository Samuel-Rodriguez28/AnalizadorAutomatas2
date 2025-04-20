import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-read-variables-dialog',
  imports: [CommonModule, ButtonModule, InputTextModule, FormsModule],
  templateUrl: './read-variables-dialog.component.html',
  styleUrl: './read-variables-dialog.component.scss'
})
export class ReadVariablesDialogComponent {
  constructor(
    private ref: DynamicDialogRef
  ) { }

  value: any | null = null;

  closeDialog(): void {
    this.ref.close(this.value);
  }
}
