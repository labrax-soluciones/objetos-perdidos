<?php

namespace App\Entity;

use App\Repository\NotificacionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: NotificacionRepository::class)]
#[ORM\Table(name: 'notificaciones')]
#[ORM\Index(columns: ['usuario_id', 'leida'])]
#[ORM\HasLifecycleCallbacks]
class Notificacion
{
    public const TIPO_COINCIDENCIA = 'COINCIDENCIA';
    public const TIPO_ESTADO_OBJETO = 'ESTADO_OBJETO';
    public const TIPO_CITA = 'CITA';
    public const TIPO_SUBASTA = 'SUBASTA';
    public const TIPO_SISTEMA = 'SISTEMA';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['notificacion:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class, inversedBy: 'notificaciones')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Usuario $usuario = null;

    #[ORM\Column(length: 30)]
    #[Groups(['notificacion:read'])]
    private string $tipo = self::TIPO_SISTEMA;

    #[ORM\Column(length: 255)]
    #[Groups(['notificacion:read'])]
    private ?string $titulo = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Groups(['notificacion:read'])]
    private ?string $mensaje = null;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['notificacion:read'])]
    private bool $leida = false;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['notificacion:read'])]
    private ?\DateTimeImmutable $fechaLectura = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['notificacion:read'])]
    private ?array $data = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['notificacion:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUsuario(): ?Usuario
    {
        return $this->usuario;
    }

    public function setUsuario(?Usuario $usuario): static
    {
        $this->usuario = $usuario;
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

    public function getTitulo(): ?string
    {
        return $this->titulo;
    }

    public function setTitulo(string $titulo): static
    {
        $this->titulo = $titulo;
        return $this;
    }

    public function getMensaje(): ?string
    {
        return $this->mensaje;
    }

    public function setMensaje(string $mensaje): static
    {
        $this->mensaje = $mensaje;
        return $this;
    }

    public function isLeida(): bool
    {
        return $this->leida;
    }

    public function setLeida(bool $leida): static
    {
        $this->leida = $leida;
        if ($leida && $this->fechaLectura === null) {
            $this->fechaLectura = new \DateTimeImmutable();
        }
        return $this;
    }

    public function marcarComoLeida(): static
    {
        return $this->setLeida(true);
    }

    public function getFechaLectura(): ?\DateTimeImmutable
    {
        return $this->fechaLectura;
    }

    public function getData(): ?array
    {
        return $this->data;
    }

    public function setData(?array $data): static
    {
        $this->data = $data;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
