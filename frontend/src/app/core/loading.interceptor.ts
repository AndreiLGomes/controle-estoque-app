import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { HttpActivityService } from './http-activity.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const atividade = inject(HttpActivityService);
  atividade.iniciar();
  return next(req).pipe(finalize(() => atividade.finalizar()));
};
