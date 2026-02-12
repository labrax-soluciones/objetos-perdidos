import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { FileUploadModule, FileUploadHandlerEvent } from 'primeng/fileupload';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';

interface Alerta {
  id: number;
  criterios: {
    categoriaId?: number;
    categoria?: string;
    color?: string;
    zona?: string;
    palabrasClave?: string;
  };
  activa: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FileUploadModule,
    TabsModule,
    InputTextModule,
    ButtonModule,
    ToastModule,
    ConfirmDialogModule,
    TagModule,
    SelectModule,
    TooltipModule
  ],
  providers: [MessageService, ConfirmationService],
  template: `
    <p-toast />
    <p-confirmDialog />
    <div class="max-w-3xl mx-auto p-8">
      <div class="mb-8">
        <h1 class="m-0">Mi perfil</h1>
      </div>

      <div class="bg-white p-4 rounded-lg shadow-md mb-6">
        <div class="flex items-center gap-6">
          <div class="relative">
            <div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              @if (profilePhotoUrl()) {
                <img [src]="profilePhotoUrl()" alt="Foto de perfil" class="w-full h-full object-cover" />
              } @else {
                <i class="pi pi-user text-4xl text-gray-400"></i>
              }
            </div>
          </div>
          <div class="flex-1">
            <h2 class="m-0 mb-2">{{ datosPersonales.nombre }} {{ datosPersonales.apellidos }}</h2>
            <p class="text-gray-500 m-0 mb-3">{{ datosPersonales.email }}</p>
            <p-fileUpload
              mode="basic"
              name="profilePhoto"
              accept="image/*"
              [maxFileSize]="5000000"
              chooseLabel="Cambiar foto"
              chooseIcon="pi pi-camera"
              [auto]="true"
              [customUpload]="true"
              (uploadHandler)="onPhotoUpload($event)"
            />
          </div>
        </div>
      </div>

      <p-tabs value="0">
        <p-tablist>
          <p-tab value="0">Datos personales</p-tab>
          <p-tab value="1">Alertas</p-tab>
          <p-tab value="2">Seguridad</p-tab>
        </p-tablist>
        <p-tabpanels>
          <p-tabpanel value="0">
          <form (ngSubmit)="guardarDatos()" class="pt-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="mb-4">
                <label for="nombre" class="block mb-2 font-medium">Nombre</label>
                <input
                  type="text"
                  pInputText
                  id="nombre"
                  [(ngModel)]="datosPersonales.nombre"
                  name="nombre"
                  required
                  class="w-full"
                >
              </div>
              <div class="mb-4">
                <label for="apellidos" class="block mb-2 font-medium">Apellidos</label>
                <input
                  type="text"
                  pInputText
                  id="apellidos"
                  [(ngModel)]="datosPersonales.apellidos"
                  name="apellidos"
                  class="w-full"
                >
              </div>
            </div>

            <div class="mb-4">
              <label for="email" class="block mb-2 font-medium">Email</label>
              <input
                type="email"
                pInputText
                id="email"
                [(ngModel)]="datosPersonales.email"
                name="email"
                disabled
                class="w-full"
              >
              <small class="text-gray-400 text-xs">El email no se puede cambiar</small>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="mb-4">
                <label for="telefono" class="block mb-2 font-medium">Telefono</label>
                <input
                  type="tel"
                  pInputText
                  id="telefono"
                  [(ngModel)]="datosPersonales.telefono"
                  name="telefono"
                  class="w-full"
                >
              </div>
              <div class="mb-4">
                <label for="dni" class="block mb-2 font-medium">DNI/NIE</label>
                <input
                  type="text"
                  pInputText
                  id="dni"
                  [(ngModel)]="datosPersonales.dni"
                  name="dni"
                  class="w-full"
                >
              </div>
            </div>

            <p-button
              type="submit"
              label="Guardar cambios"
              [loading]="guardandoDatos()"
              icon="pi pi-save"
            />
          </form>
          </p-tabpanel>

          <p-tabpanel value="1">
          <div class="pt-4">
            <p class="text-gray-500 mb-6">Recibe notificaciones cuando aparezcan objetos que coincidan con tus criterios.</p>

            @if (loadingAlertas()) {
              <div class="text-gray-500 text-center py-8">Cargando alertas...</div>
            } @else {
              @if (alertas().length === 0) {
                <p class="text-gray-400 text-center py-8 bg-gray-50 rounded-lg mb-4">No tienes alertas configuradas</p>
              } @else {
                <div class="mb-4">
                  @for (alerta of alertas(); track alerta.id) {
                    <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg mb-2" [class.opacity-60]="!alerta.activa">
                      <div>
                        <div class="flex flex-wrap gap-2 mb-1">
                          @if (alerta.criterios.categoria) {
                            <p-tag [value]="alerta.criterios.categoria" severity="info" />
                          }
                          @if (alerta.criterios.color) {
                            <p-tag [value]="'Color: ' + alerta.criterios.color" severity="info" />
                          }
                          @if (alerta.criterios.zona) {
                            <p-tag [value]="'Zona: ' + alerta.criterios.zona" severity="info" />
                          }
                          @if (alerta.criterios.palabrasClave) {
                            <p-tag [value]="alerta.criterios.palabrasClave" severity="info" />
                          }
                        </div>
                        <span class="text-xs text-gray-400">Creada: {{ alerta.createdAt | date:'dd/MM/yyyy' }}</span>
                      </div>
                      <div class="flex gap-2">
                        <p-button
                          [icon]="alerta.activa ? 'pi pi-bell' : 'pi pi-bell-slash'"
                          [rounded]="true"
                          [text]="true"
                          [severity]="alerta.activa ? 'info' : 'secondary'"
                          (onClick)="toggleAlerta(alerta)"
                          [pTooltip]="alerta.activa ? 'Desactivar' : 'Activar'"
                        />
                        <p-button
                          icon="pi pi-trash"
                          [rounded]="true"
                          [text]="true"
                          severity="danger"
                          (onClick)="confirmarEliminarAlerta(alerta.id)"
                          pTooltip="Eliminar"
                        />
                      </div>
                    </div>
                  }
                </div>
              }

              <p-button
                [label]="mostrarFormAlerta ? 'Cancelar' : 'Nueva alerta'"
                [outlined]="true"
                [icon]="mostrarFormAlerta ? 'pi pi-times' : 'pi pi-plus'"
                (onClick)="mostrarFormAlerta = !mostrarFormAlerta"
              />

              @if (mostrarFormAlerta) {
                <form class="mt-6 pt-6 border-t border-gray-200" (ngSubmit)="crearAlerta()">
                  <div class="mb-4">
                    <label class="block mb-2 font-medium">Categoria</label>
                    <p-select
                      [(ngModel)]="nuevaAlerta.categoriaId"
                      name="categoriaId"
                      [options]="categorias()"
                      optionLabel="nombre"
                      optionValue="id"
                      placeholder="Cualquiera"
                      [showClear]="true"
                      styleClass="w-full"
                    />
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="mb-4">
                      <label class="block mb-2 font-medium">Color</label>
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="nuevaAlerta.color"
                        name="color"
                        placeholder="Ej: Negro, Azul..."
                        class="w-full"
                      >
                    </div>
                    <div class="mb-4">
                      <label class="block mb-2 font-medium">Zona</label>
                      <input
                        type="text"
                        pInputText
                        [(ngModel)]="nuevaAlerta.zona"
                        name="zona"
                        placeholder="Ej: Centro, Alameda..."
                        class="w-full"
                      >
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block mb-2 font-medium">Palabras clave</label>
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="nuevaAlerta.palabrasClave"
                      name="palabrasClave"
                      placeholder="Ej: Samsung, cartera, llaves..."
                      class="w-full"
                    >
                  </div>

                  <p-button
                    type="submit"
                    label="Crear alerta"
                    [loading]="creandoAlerta()"
                    icon="pi pi-plus"
                  />
                </form>
              }
            }
          </div>
          </p-tabpanel>

          <p-tabpanel value="2">
          <form (ngSubmit)="cambiarPassword()" class="pt-4">
            <div class="mb-4">
              <label for="currentPassword" class="block mb-2 font-medium">Contrasena actual</label>
              <input
                type="password"
                pInputText
                id="currentPassword"
                [(ngModel)]="passwordData.currentPassword"
                name="currentPassword"
                required
                class="w-full"
              >
            </div>

            <div class="mb-4">
              <label for="newPassword" class="block mb-2 font-medium">Nueva contrasena</label>
              <input
                type="password"
                pInputText
                id="newPassword"
                [(ngModel)]="passwordData.newPassword"
                name="newPassword"
                required
                minlength="8"
                class="w-full"
              >
              <small class="text-gray-400 text-xs">Minimo 8 caracteres</small>
            </div>

            <div class="mb-4">
              <label for="confirmPassword" class="block mb-2 font-medium">Confirmar contrasena</label>
              <input
                type="password"
                pInputText
                id="confirmPassword"
                [(ngModel)]="passwordData.confirmPassword"
                name="confirmPassword"
                required
                class="w-full"
              >
            </div>

            <p-button
              type="submit"
              label="Cambiar contrasena"
              [loading]="guardandoPassword()"
              icon="pi pi-lock"
            />

            <div class="mt-8 pt-8 border-t border-gray-200">
              <h3 class="text-lg font-medium text-red-600 mb-4">Cerrar sesion</h3>
              <p class="mb-4 text-gray-600">Cierra tu sesion en este dispositivo.</p>
              <p-button
                label="Cerrar sesion"
                severity="danger"
                icon="pi pi-sign-out"
                (onClick)="cerrarSesion()"
              />
            </div>
          </form>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>
    </div>
  `,
  styles: []
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  datosPersonales = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    dni: ''
  };

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  alertas = signal<Alerta[]>([]);
  categorias = signal<any[]>([]);
  profilePhotoUrl = signal<string>('');

  guardandoDatos = signal(false);
  guardandoPassword = signal(false);

  loadingAlertas = signal(true);
  mostrarFormAlerta = false;
  creandoAlerta = signal(false);

  nuevaAlerta: { categoriaId: number | null; color: string; zona: string; palabrasClave: string } = {
    categoriaId: null,
    color: '',
    zona: '',
    palabrasClave: ''
  };

  ngOnInit() {
    this.cargarDatosUsuario();
    this.cargarAlertas();
    this.cargarCategorias();
  }

  private cargarDatosUsuario() {
    const user = this.authService.currentUser();
    if (user) {
      this.datosPersonales = {
        nombre: user.nombre || '',
        apellidos: user.apellidos || '',
        email: user.email || '',
        telefono: user.telefono || '',
        dni: user.dni || ''
      };
      if ((user as any).photoUrl) {
        this.profilePhotoUrl.set((user as any).photoUrl);
      }
    }
  }

  private cargarAlertas() {
    this.loadingAlertas.set(true);
    this.api.get<Alerta[]>('/alertas').subscribe({
      next: (alertas) => {
        this.alertas.set(alertas);
        this.loadingAlertas.set(false);
      },
      error: () => {
        this.loadingAlertas.set(false);
      }
    });
  }

  private cargarCategorias() {
    this.api.get<any[]>('/categorias').subscribe({
      next: (categorias) => this.categorias.set(categorias)
    });
  }

  onPhotoUpload(event: FileUploadHandlerEvent) {
    const file = event.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('photo', file);

      this.api.post<{ url: string }>('/perfil/photo', formData).subscribe({
        next: (response) => {
          this.profilePhotoUrl.set(response.url);
          this.messageService.add({
            severity: 'success',
            summary: 'Exito',
            detail: 'Foto de perfil actualizada'
          });
          this.authService.refreshUser();
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message || 'Error al subir la foto'
          });
        }
      });
    }
  }

  guardarDatos() {
    this.guardandoDatos.set(true);

    this.api.put('/perfil', this.datosPersonales).subscribe({
      next: () => {
        this.guardandoDatos.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Datos actualizados correctamente'
        });
        this.authService.refreshUser();
      },
      error: (err) => {
        this.guardandoDatos.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al guardar los datos'
        });
      }
    });
  }

  cambiarPassword() {
    if (this.passwordData.newPassword.length < 8) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La nueva contrasena debe tener al menos 8 caracteres'
      });
      return;
    }

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Las contrasenas no coinciden'
      });
      return;
    }

    this.guardandoPassword.set(true);

    this.api.put('/perfil/password', {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.guardandoPassword.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Contrasena cambiada correctamente'
        });
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err) => {
        this.guardandoPassword.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al cambiar la contrasena'
        });
      }
    });
  }

  toggleAlerta(alerta: Alerta) {
    this.api.put(`/alertas/${alerta.id}`, { activa: !alerta.activa }).subscribe({
      next: () => {
        const alertas = this.alertas();
        const index = alertas.findIndex(a => a.id === alerta.id);
        if (index !== -1) {
          alertas[index].activa = !alertas[index].activa;
          this.alertas.set([...alertas]);
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: alerta.activa ? 'Alerta desactivada' : 'Alerta activada'
        });
      }
    });
  }

  confirmarEliminarAlerta(id: number) {
    this.confirmationService.confirm({
      message: '¿Seguro que quieres eliminar esta alerta?',
      header: 'Confirmar eliminacion',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Si, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.eliminarAlerta(id);
      }
    });
  }

  private eliminarAlerta(id: number) {
    this.api.delete(`/alertas/${id}`).subscribe({
      next: () => {
        this.alertas.set(this.alertas().filter(a => a.id !== id));
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Alerta eliminada'
        });
      }
    });
  }

  crearAlerta() {
    const criterios: any = {};
    if (this.nuevaAlerta.categoriaId) criterios.categoriaId = this.nuevaAlerta.categoriaId;
    if (this.nuevaAlerta.color) criterios.color = this.nuevaAlerta.color;
    if (this.nuevaAlerta.zona) criterios.zona = this.nuevaAlerta.zona;
    if (this.nuevaAlerta.palabrasClave) criterios.palabrasClave = this.nuevaAlerta.palabrasClave;

    if (Object.keys(criterios).length === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atencion',
        detail: 'Debes definir al menos un criterio'
      });
      return;
    }

    this.creandoAlerta.set(true);

    this.api.post<Alerta>('/alertas', { criterios }).subscribe({
      next: (alerta) => {
        this.creandoAlerta.set(false);
        this.alertas.set([alerta, ...this.alertas()]);
        this.mostrarFormAlerta = false;
        this.nuevaAlerta = { categoriaId: null, color: '', zona: '', palabrasClave: '' };
        this.messageService.add({
          severity: 'success',
          summary: 'Exito',
          detail: 'Alerta creada correctamente'
        });
      },
      error: (err) => {
        this.creandoAlerta.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.message || 'Error al crear la alerta'
        });
      }
    });
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
