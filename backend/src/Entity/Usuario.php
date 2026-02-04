<?php

namespace App\Entity;

use App\Repository\UsuarioRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: UsuarioRepository::class)]
#[ORM\Table(name: 'usuarios')]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['email'], message: 'Ya existe una cuenta con este email')]
class Usuario implements UserInterface, PasswordAuthenticatedUserInterface
{
    public const TIPO_CIUDADANO = 'CIUDADANO';
    public const TIPO_ADMIN_MUNICIPAL = 'ADMIN_MUNICIPAL';
    public const TIPO_ADMIN_EXTERNO = 'ADMIN_EXTERNO';
    public const TIPO_LOGISTICA = 'LOGISTICA';
    public const TIPO_SUPERADMIN = 'SUPERADMIN';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['usuario:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255, unique: true)]
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Groups(['usuario:read', 'usuario:write'])]
    private ?string $email = null;

    #[ORM\Column]
    private ?string $password = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank]
    #[Groups(['usuario:read', 'usuario:write'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['usuario:read', 'usuario:write'])]
    private ?string $apellidos = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['usuario:read', 'usuario:write'])]
    private ?string $telefono = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['usuario:read', 'usuario:write'])]
    private ?string $dni = null;

    #[ORM\Column(length: 30)]
    #[Assert\Choice(choices: [
        self::TIPO_CIUDADANO,
        self::TIPO_ADMIN_MUNICIPAL,
        self::TIPO_ADMIN_EXTERNO,
        self::TIPO_LOGISTICA,
        self::TIPO_SUPERADMIN
    ])]
    #[Groups(['usuario:read', 'usuario:write'])]
    private string $tipo = self::TIPO_CIUDADANO;

    #[ORM\ManyToOne(targetEntity: Ayuntamiento::class, inversedBy: 'usuarios')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['usuario:read'])]
    private ?Ayuntamiento $ayuntamiento = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['usuario:read'])]
    private bool $activo = true;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['usuario:read'])]
    private bool $emailVerificado = false;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $emailVerificationToken = null;

    #[ORM\Column(length: 100, nullable: true)]
    private ?string $passwordResetToken = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $passwordResetTokenExpiresAt = null;

    #[ORM\Column(type: Types::JSON)]
    private array $roles = [];

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['usuario:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['usuario:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(targetEntity: Objeto::class, mappedBy: 'usuarioReporta')]
    private Collection $objetosReportados;

    #[ORM\OneToMany(targetEntity: Solicitud::class, mappedBy: 'ciudadano')]
    private Collection $solicitudes;

    #[ORM\OneToMany(targetEntity: Alerta::class, mappedBy: 'ciudadano')]
    private Collection $alertas;

    #[ORM\OneToMany(targetEntity: Notificacion::class, mappedBy: 'usuario')]
    private Collection $notificaciones;

    #[ORM\OneToMany(targetEntity: Puja::class, mappedBy: 'usuario')]
    private Collection $pujas;

    #[ORM\OneToMany(targetEntity: MovimientoObjeto::class, mappedBy: 'usuario')]
    private Collection $movimientos;

    #[ORM\ManyToMany(targetEntity: Permiso::class)]
    #[ORM\JoinTable(name: 'usuario_permisos')]
    private Collection $permisos;

    public function __construct()
    {
        $this->objetosReportados = new ArrayCollection();
        $this->solicitudes = new ArrayCollection();
        $this->alertas = new ArrayCollection();
        $this->notificaciones = new ArrayCollection();
        $this->pujas = new ArrayCollection();
        $this->movimientos = new ArrayCollection();
        $this->permisos = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(string $email): static
    {
        $this->email = $email;
        return $this;
    }

    public function getUserIdentifier(): string
    {
        return (string) $this->email;
    }

    public function getRoles(): array
    {
        $roles = $this->roles;
        $roles[] = 'ROLE_USER';

        switch ($this->tipo) {
            case self::TIPO_SUPERADMIN:
                $roles[] = 'ROLE_SUPERADMIN';
                $roles[] = 'ROLE_ADMIN';
                break;
            case self::TIPO_ADMIN_MUNICIPAL:
            case self::TIPO_ADMIN_EXTERNO:
                $roles[] = 'ROLE_ADMIN';
                break;
            case self::TIPO_LOGISTICA:
                $roles[] = 'ROLE_LOGISTICA';
                break;
        }

        return array_unique($roles);
    }

    public function setRoles(array $roles): static
    {
        $this->roles = $roles;
        return $this;
    }

    public function getPassword(): ?string
    {
        return $this->password;
    }

    public function setPassword(string $password): static
    {
        $this->password = $password;
        return $this;
    }

    public function eraseCredentials(): void
    {
    }

    public function getNombre(): ?string
    {
        return $this->nombre;
    }

    public function setNombre(string $nombre): static
    {
        $this->nombre = $nombre;
        return $this;
    }

    public function getApellidos(): ?string
    {
        return $this->apellidos;
    }

    public function setApellidos(?string $apellidos): static
    {
        $this->apellidos = $apellidos;
        return $this;
    }

    public function getNombreCompleto(): string
    {
        return trim($this->nombre . ' ' . $this->apellidos);
    }

    public function getTelefono(): ?string
    {
        return $this->telefono;
    }

    public function setTelefono(?string $telefono): static
    {
        $this->telefono = $telefono;
        return $this;
    }

    public function getDni(): ?string
    {
        return $this->dni;
    }

    public function setDni(?string $dni): static
    {
        $this->dni = $dni;
        return $this;
    }

    public function getTipo(): string
    {
        return $this->tipo;
    }

    public function setTipo(string $tipo): static
    {
        $this->tipo = $tipo;
        return $this;
    }

    public function getAyuntamiento(): ?Ayuntamiento
    {
        return $this->ayuntamiento;
    }

    public function setAyuntamiento(?Ayuntamiento $ayuntamiento): static
    {
        $this->ayuntamiento = $ayuntamiento;
        return $this;
    }

    public function isActivo(): bool
    {
        return $this->activo;
    }

    public function setActivo(bool $activo): static
    {
        $this->activo = $activo;
        return $this;
    }

    public function isEmailVerificado(): bool
    {
        return $this->emailVerificado;
    }

    public function setEmailVerificado(bool $emailVerificado): static
    {
        $this->emailVerificado = $emailVerificado;
        return $this;
    }

    public function getEmailVerificationToken(): ?string
    {
        return $this->emailVerificationToken;
    }

    public function setEmailVerificationToken(?string $emailVerificationToken): static
    {
        $this->emailVerificationToken = $emailVerificationToken;
        return $this;
    }

    public function getPasswordResetToken(): ?string
    {
        return $this->passwordResetToken;
    }

    public function setPasswordResetToken(?string $passwordResetToken): static
    {
        $this->passwordResetToken = $passwordResetToken;
        return $this;
    }

    public function getPasswordResetTokenExpiresAt(): ?\DateTimeImmutable
    {
        return $this->passwordResetTokenExpiresAt;
    }

    public function setPasswordResetTokenExpiresAt(?\DateTimeImmutable $passwordResetTokenExpiresAt): static
    {
        $this->passwordResetTokenExpiresAt = $passwordResetTokenExpiresAt;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * @return Collection<int, Objeto>
     */
    public function getObjetosReportados(): Collection
    {
        return $this->objetosReportados;
    }

    /**
     * @return Collection<int, Solicitud>
     */
    public function getSolicitudes(): Collection
    {
        return $this->solicitudes;
    }

    /**
     * @return Collection<int, Alerta>
     */
    public function getAlertas(): Collection
    {
        return $this->alertas;
    }

    /**
     * @return Collection<int, Notificacion>
     */
    public function getNotificaciones(): Collection
    {
        return $this->notificaciones;
    }

    /**
     * @return Collection<int, Puja>
     */
    public function getPujas(): Collection
    {
        return $this->pujas;
    }

    /**
     * @return Collection<int, MovimientoObjeto>
     */
    public function getMovimientos(): Collection
    {
        return $this->movimientos;
    }

    /**
     * @return Collection<int, Permiso>
     */
    public function getPermisos(): Collection
    {
        return $this->permisos;
    }

    public function addPermiso(Permiso $permiso): static
    {
        if (!$this->permisos->contains($permiso)) {
            $this->permisos->add($permiso);
        }
        return $this;
    }

    public function removePermiso(Permiso $permiso): static
    {
        $this->permisos->removeElement($permiso);
        return $this;
    }

    public function isSuperAdmin(): bool
    {
        return $this->tipo === self::TIPO_SUPERADMIN;
    }

    public function isAdmin(): bool
    {
        return in_array($this->tipo, [
            self::TIPO_SUPERADMIN,
            self::TIPO_ADMIN_MUNICIPAL,
            self::TIPO_ADMIN_EXTERNO
        ]);
    }
}
