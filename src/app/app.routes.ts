import { Routes } from '@angular/router';
import { TeachBackFlow } from './components/teach-back-flow/teach-back-flow';
import { LongTest } from './pages/long-test/long-test';
import { Mastery } from './pages/mastery/mastery';
import { NowLearning } from './pages/now-learning/now-learning';

export const routes: Routes = [
  { path: '', component: TeachBackFlow },
  { path: 'learning', component: NowLearning },
  { path: 'mastery', component: Mastery },
  { path: 'test', component: LongTest },
  { path: '**', redirectTo: '' },
];
