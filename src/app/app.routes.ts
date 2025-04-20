import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./features/compiler/compiler.routes').then(
        (c) => c.COMPILER_ROUTES
      ),
  },
];
