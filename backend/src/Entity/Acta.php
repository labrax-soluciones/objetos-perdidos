<?php

namespace App\Entity;

use App\Repository\ActaRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;

#[ORM\Entity(repositoryClass: ActaRepository::class)]
#[ORM\Table(name: 'actas')]
#[ORM\HasLifecycleCallbacks]
class Acta
{
    public const TIPO_ENTREGA = 'ENTREGA';
    public const TIPO_ADJUDICACION = 'ADJUDICACION';
    public const TIPO_DONACION = 'DONACION';
    public const TIPO_DESTRUCCION = 'DESTRUCCION';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['acta:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['acta:read'])]
    private ?string $codigo = null;

    #[ORM\Column(length: 20)]
    #[Groups(['acta:read'])]
    private string $tipo = self::TIPO_ENTREGA;

    #[ORM\ManyToOne(targetEntity: Objeto::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['acta:read'])]
    private ?Objeto $objeto = null;

    #[ORM\ManyToOne(targetEntity: Lote::class, inversedBy: 'actas')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Lote $lote = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['acta:read'])]
    private ?Usuario $usuarioEntrega = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['acta:read'])]
    private ?Usuario $usuarioRecibe = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['acta:read'])]
    private ?string $firmaDigital = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Groups(['acta:read'])]
    private ?string $pdfUrl = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['acta:read'])]
    private ?string $observaciones = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['acta:read'])]
    private ?array $datosAdicionales = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['acta:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\PrePersist]
    public function setCreatedValues(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        if ($this->codigo === null) {
            $this->codigo = 'ACT-' . strtoupper(substr(Uuid::v4()->toBase58(), 0, 10));
        }
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCodigo(): ?string
    {
        return $this->codigo;
    }

    public function setCodigo(string $codigo): static
    {
        $this->codigo = $codigo;
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

    public function getObjeto(): ?Objeto
    {
        return $this->objeto;
    }

    public function setObjeto(?Objeto $objeto): static
    {
        $this->objeto = $objeto;
        return $this;
    }

    public function getLote(): ?Lote
    {
        return $this->lote;
    }

    public function setLote(?Lote $lote): static
    {
        $this->lote = $lote;
        return $this;
    }

    public function getUsuarioEntrega(): ?Usuario
    {
        return $this->usuarioEntrega;
    }

    public function setUsuarioEntrega(?Usuario $usuarioEntrega): static
    {
        $this->usuarioEntrega = $usuarioEntrega;
        return $this;
    }

    public function getUsuarioRecibe(): ?Usuario
    {
        return $this->usuarioRecibe;
    }

    public function setUsuarioRecibe(?Usuario $usuarioRecibe): static
    {
        $this->usuarioRecibe = $usuarioRecibe;
        return $this;
    }

    public function getFirmaDigital(): ?string
    {
        return $this->firmaDigital;
    }

    public function setFirmaDigital(?string $firmaDigital): static
    {
        $this->firmaDigital = $firmaDigital;
        return $this;
    }

    public function getPdfUrl(): ?string
    {
        return $this->pdfUrl;
    }

    public function setPdfUrl(?string $pdfUrl): static
    {
        $this->pdfUrl = $pdfUrl;
        return $this;
    }

    public function getObservaciones(): ?string
    {
        return $this->observaciones;
    }

    public function setObservaciones(?string $observaciones): static
    {
        $this->observaciones = $observaciones;
        return $this;
    }

    public function getDatosAdicionales(): ?array
    {
        return $this->datosAdicionales;
    }

    public function setDatosAdicionales(?array $datosAdicionales): static
    {
        $this->datosAdicionales = $datosAdicionales;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }
}
