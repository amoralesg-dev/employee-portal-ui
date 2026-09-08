import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Auth } from '@rassini/rassini-ui';

import {
  PageContentComponent
} from '@rassini/rassini-ui';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    TagModule,
    TooltipModule,
    PageContentComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly auth = inject(Auth);
  
  username = '';
  
  newsList = [
    {
      id: 1,
      title: 'Nueva Política de Trabajo Remoto',
      summary: 'Revisa las actualizaciones sobre nuestros días de home office y flexibilidad.',
      image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=400&q=80',
      date: '2026-09-01'
    },
    {
      id: 2,
      title: 'Resultados Financieros Q3',
      summary: 'Un trimestre récord gracias al esfuerzo de todos los equipos. Conoce los detalles.',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
      date: '2026-08-28'
    },
    {
      id: 3,
      title: 'Apertura de Nueva Planta',
      summary: 'Inauguramos nuevas instalaciones para aumentar nuestra capacidad productiva.',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
      date: '2026-08-20'
    }
  ];

  announcements = [
    { title: 'Mantenimiento del ERP', priority: 'HIGH', date: 'Esta noche, 22:00 hrs', content: 'El sistema SAP no estará disponible durante 2 horas.' },
    { title: 'Encuesta de Clima Laboral', priority: 'MEDIUM', date: 'Hasta el viernes', content: 'Tu opinión es importante, recuerda completarla.' }
  ];

  events = [
    { title: 'Townhall Q3', date: '15 de Septiembre, 10:00 AM', location: 'Auditorio Principal / Teams' },
    { title: 'Torneo de Fútbol', date: '22 de Septiembre, 08:00 AM', location: 'Canchas Deportivas Sur' }
  ];

  birthdays = [
    { name: 'Ana Martínez', role: 'Finanzas', date: 'Hoy' },
    { name: 'Carlos López', role: 'Operaciones', date: 'Mañana' },
    { name: 'Diana Gómez', role: 'Sistemas', date: 'Jueves' }
  ];

  anniversaries = [
    { name: 'Roberto Pérez', years: 5, role: 'Gerente de Planta', date: 'Hoy' },
    { name: 'Laura Torres', years: 10, role: 'Directora Comercial', date: 'Lunes' }
  ];

  quickLinks = [
    { title: 'Directorio', desc: 'Encuentra a tus compañeros', icon: 'pi pi-users', color: 'bg-orange-100 text-orange-700' },
    { title: 'Vacaciones', desc: 'Solicita y gestiona tus días libres', icon: 'pi pi-calendar', color: 'bg-green-100 text-green-700' },
    { title: 'Recibos Nómina', desc: 'Consulta tus comprobantes', icon: 'pi pi-file', color: 'bg-gray-100 text-gray-700' },
    { title: 'Soporte IT', desc: 'Reporta un incidente técnico', icon: 'pi pi-desktop', color: 'bg-red-100 text-red-700' },
    { title: 'Beneficios', desc: 'Descubre convenios y descuentos', icon: 'pi pi-star', color: 'bg-yellow-100 text-yellow-700' }
  ];

  ngOnInit() {
    this.username = this.auth.currentUser()?.username || 'Colaborador';
  }
}
