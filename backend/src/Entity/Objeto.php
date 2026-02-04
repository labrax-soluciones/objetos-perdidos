<?php

namespace App\Entity;

use App\Repository\ObjetoRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ObjetoRepository::class)]
#[ORM\Table(name: 'objetos')]
#[ORM\Index(columns: ['tipo', 'estado'])]
#[ORM\Index(columns: ['ayuntamiento_id', 'estado'])]
#[ORM\HasLifecycleCallbacks]
class Objeto
{
    public const TIPO_ENCONTRADO = 'ENCONTRADO';
    public const TIPO_PERDIDO = 'PERDIDO';

    public const ESTADO_REGISTRADO = 'REGISTRADO';
    public const ESTADO_EN_ALMACEN = 'EN_ALMACEN';
    public const ESTADO_RECLAMADO = 'RECLAMADO';
    public const ESTADO_ENTREGADO = 'ENTREGADO';
    public const ESTADO_SUBASTA = 'SUBASTA';
    public const ESTADO_DONADO = 'DONADO';
    public const ESTADO_RECICLADO = 'RECICLADO';
    public const ESTADO_DESTRUIDO = 'DESTRUIDO';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['objeto:read', 'objeto:list'])]
    private ?int $id = null;

    #[ORM\Column(length: 50, unique: true)]
    #[Groups(['objeto:read', 'objeto:list'])]
    private ?string $codigoUnico = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(choices: [self::TIPO_ENCONTRADO, self::TIPO_PERDIDO])]
    #[Groups(['objeto:read', 'objeto:list', 'objeto:write'])]
    private string $tipo = self::TIPO_ENCONTRADO;

    #[ORM\Column(length: 30)]
    #[Assert\Choice(choices: [
        self::ESTADO_REGISTRADO,
        self::ESTADO_EN_ALMACEN,
        self::ESTADO_RECLAMADO,
        self::ESTADO_ENTREGADO,
        self::ESTADO_SUBASTA,
        self::ESTADO_DONADO,
        self::ESTADO_RECICLADO,
        self::ESTADO_DESTRUIDO
    ])]
    #[Groups(['objeto:read', 'objeto:list'])]
    private string $estado = self::ESTADO_REGISTRADO;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['objeto:read', 'objeto:list', 'objeto:write'])]
    private ?string $titulo = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $descripcion = null;

    #[ORM\ManyToOne(targetEntity: Categoria::class, inversedBy: 'objetos')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['objeto:read', 'objeto:list'])]
    private ?Categoria $categoria = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $marca = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $modelo = null;

    #[ORM\Column(length: 50, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $color = null;

    #[ORM\Column(length: 100, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $numeroSerie = null;

    #[ORM\Column(type: Types::DATE_MUTABLE, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?\DateTimeInterface $fechaHallazgo = null;

    #[ORM\Column(type: Types::TIME_MUTABLE, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?\DateTimeInterface $horaHallazgo = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $ubicacionHallazgoGeom = null;

    #[ORM\Column(length: 500, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $direccionHallazgo = null;

    #[ORM\Column(length: 150, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $halladorNombre = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $halladorTelefono = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $halladorDni = null;

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $halladorObservaciones = null;

    #[ORM\Column(type: 'float', nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?float $latitud = null;

    #[ORM\Column(type: 'float', nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?float $longitud = null;

    #[ORM\ManyToOne(targetEntity: Ayuntamiento::class, inversedBy: 'objetos')]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['objeto:read'])]
    private ?Ayuntamiento $ayuntamiento = null;

    #[ORM\ManyToOne(targetEntity: Usuario::class, inversedBy: 'objetosReportados')]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['objeto:read'])]
    private ?Usuario $usuarioReporta = null;

    #[ORM\ManyToOne(targetEntity: Ubicacion::class)]
    #[ORM\JoinColumn(nullable: true)]
    #[Groups(['objeto:read'])]
    private ?Ubicacion $ubicacionAlmacen = null;

    #[ORM\ManyToOne(targetEntity: Lote::class, inversedBy: 'objetos')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Lote $lote = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['objeto:read'])]
    private ?string $qrCode = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2, nullable: true)]
    #[Groups(['objeto:read', 'objeto:write'])]
    private ?string $valorEstimado = null;

    #[ORM\Column(type: Types::JSON, nullable: true)]
    #[Groups(['objeto:read'])]
    private ?array $metadataIa = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    #[Groups(['objeto:read', 'objeto:list'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    #[Groups(['objeto:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\OneToMany(targetEntity: ObjetoFoto::class, mappedBy: 'objeto', cascade: ['persist', 'remove'])]
    #[ORM\OrderBy(['orden' => 'ASC'])]
    #[Groups(['objeto:read', 'objeto:list'])]
    private Collection $fotos;

    #[ORM\OneToMany(targetEntity: MovimientoObjeto::class, mappedBy: 'objeto')]
    #[ORM\OrderBy(['createdAt' => 'DESC'])]
    private Collection $movimientos;

    #[ORM\OneToMany(targetEntity: Solicitud::class, mappedBy: 'objeto')]
    private Collection $solicitudes;

    #[ORM\OneToMany(targetEntity: Coincidencia::class, mappedBy: 'objetoEncontrado')]
    private Collection $coincidenciasComoEncontrado;

    #[ORM\OneToMany(targetEntity: Coincidencia::class, mappedBy: 'objetoPerdido')]
    private Collection $coincidenciasComoPerdido;

    public function __construct()
    {
        $this->fotos = new ArrayCollection();
        $this->movimientos = new ArrayCollection();
        $this->solicitudes = new ArrayCollection();
        $this->coincidenciasComoEncontrado = new ArrayCollection();
        $this->coincidenciasComoPerdido = new ArrayCollection();
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        if ($this->codigoUnico === null) {
            $this->codigoUnico = 'OBJ-' . strtoupper(substr(Uuid::v4()->toBase58(), 0, 12));
        }
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

    public function getCodigoUnico(): ?string
    {
        return $this->codigoUnico;
    }

    public function setCodigoUnico(string $codigoUnico): static
    {
        $this->codigoUnico = $codigoUnico;
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

    public function getEstado(): string
    {
        return $this->estado;
    }

    public function setEstado(string $estado): static
    {
        $this->estado = $estado;
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

    public function getDescripcion(): ?string
    {
        return $this->descripcion;
    }

    public function setDescripcion(?string $descripcion): static
    {
        $this->descripcion = $descripcion;
        return $this;
    }

    public function getCategoria(): ?Categoria
    {
        return $this->categoria;
    }

    public function setCategoria(?Categoria $categoria): static
    {
        $this->categoria = $categoria;
        return $this;
    }

    public function getMarca(): ?string
    {
        return $this->marca;
    }

    public function setMarca(?string $marca): static
    {
        $this->marca = $marca;
        return $this;
    }

    public function getModelo(): ?string
    {
        return $this->modelo;
    }

    public function setModelo(?string $modelo): static
    {
        $this->modelo = $modelo;
        return $this;
    }

    public function getColor(): ?string
    {
        return $this->color;
    }

    public function setColor(?string $color): static
    {
        $this->color = $color;
        return $this;
    }

    public function getNumeroSerie(): ?string
    {
        return $this->numeroSerie;
    }

    public function setNumeroSerie(?string $numeroSerie): static
    {
        $this->numeroSerie = $numeroSerie;
        return $this;
    }

    public function getFechaHallazgo(): ?\DateTimeInterface
    {
        return $this->fechaHallazgo;
    }

    public function setFechaHallazgo(?\DateTimeInterface $fechaHallazgo): static
    {
        $this->fechaHallazgo = $fechaHallazgo;
        return $this;
    }

    public function getHoraHallazgo(): ?\DateTimeInterface
    {
        return $this->horaHallazgo;
    }

    public function setHoraHallazgo(?\DateTimeInterface $horaHallazgo): static
    {
        $this->horaHallazgo = $horaHallazgo;
        return $this;
    }

    public function getUbicacionHallazgoGeom(): ?string
    {
        return $this->ubicacionHallazgoGeom;
    }

    public function setUbicacionHallazgoGeom(?string $ubicacionHallazgoGeom): static
    {
        $this->ubicacionHallazgoGeom = $ubicacionHallazgoGeom;
        return $this;
    }

    public function getDireccionHallazgo(): ?string
    {
        return $this->direccionHallazgo;
    }

    public function setDireccionHallazgo(?string $direccionHallazgo): static
    {
        $this->direccionHallazgo = $direccionHallazgo;
        return $this;
    }

    public function getHalladorNombre(): ?string
    {
        return $this->halladorNombre;
    }

    public function setHalladorNombre(?string $halladorNombre): static
    {
        $this->halladorNombre = $halladorNombre;
        return $this;
    }

    public function getHalladorTelefono(): ?string
    {
        return $this->halladorTelefono;
    }

    public function setHalladorTelefono(?string $halladorTelefono): static
    {
        $this->halladorTelefono = $halladorTelefono;
        return $this;
    }

    public function getHalladorDni(): ?string
    {
        return $this->halladorDni;
    }

    public function setHalladorDni(?string $halladorDni): static
    {
        $this->halladorDni = $halladorDni;
        return $this;
    }

    public function getHalladorObservaciones(): ?string
    {
        return $this->halladorObservaciones;
    }

    public function setHalladorObservaciones(?string $halladorObservaciones): static
    {
        $this->halladorObservaciones = $halladorObservaciones;
        return $this;
    }

    public function getLatitud(): ?float
    {
        return $this->latitud;
    }

    public function setLatitud(?float $latitud): static
    {
        $this->latitud = $latitud;
        return $this;
    }

    public function getLongitud(): ?float
    {
        return $this->longitud;
    }

    public function setLongitud(?float $longitud): static
    {
        $this->longitud = $longitud;
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

    public function getUsuarioReporta(): ?Usuario
    {
        return $this->usuarioReporta;
    }

    public function setUsuarioReporta(?Usuario $usuarioReporta): static
    {
        $this->usuarioReporta = $usuarioReporta;
        return $this;
    }

    public function getUbicacionAlmacen(): ?Ubicacion
    {
        return $this->ubicacionAlmacen;
    }

    public function setUbicacionAlmacen(?Ubicacion $ubicacionAlmacen): static
    {
        $this->ubicacionAlmacen = $ubicacionAlmacen;
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

    public function getQrCode(): ?string
    {
        return $this->qrCode;
    }

    public function setQrCode(?string $qrCode): static
    {
        $this->qrCode = $qrCode;
        return $this;
    }

    public function getValorEstimado(): ?string
    {
        return $this->valorEstimado;
    }

    public function setValorEstimado(?string $valorEstimado): static
    {
        $this->valorEstimado = $valorEstimado;
        return $this;
    }

    public function getMetadataIa(): ?array
    {
        return $this->metadataIa;
    }

    public function setMetadataIa(?array $metadataIa): static
    {
        $this->metadataIa = $metadataIa;
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
     * @return Collection<int, ObjetoFoto>
     */
    public function getFotos(): Collection
    {
        return $this->fotos;
    }

    public function addFoto(ObjetoFoto $foto): static
    {
        if (!$this->fotos->contains($foto)) {
            $this->fotos->add($foto);
            $foto->setObjeto($this);
        }
        return $this;
    }

    public function removeFoto(ObjetoFoto $foto): static
    {
        if ($this->fotos->removeElement($foto)) {
            if ($foto->getObjeto() === $this) {
                $foto->setObjeto(null);
            }
        }
        return $this;
    }

    public function getFotoPrincipal(): ?ObjetoFoto
    {
        foreach ($this->fotos as $foto) {
            if ($foto->isEsPrincipal()) {
                return $foto;
            }
        }
        return $this->fotos->first() ?: null;
    }

    /**
     * @return Collection<int, MovimientoObjeto>
     */
    public function getMovimientos(): Collection
    {
        return $this->movimientos;
    }

    /**
     * @return Collection<int, Solicitud>
     */
    public function getSolicitudes(): Collection
    {
        return $this->solicitudes;
    }

    /**
     * @return Collection<int, Coincidencia>
     */
    public function getCoincidenciasComoEncontrado(): Collection
    {
        return $this->coincidenciasComoEncontrado;
    }

    /**
     * @return Collection<int, Coincidencia>
     */
    public function getCoincidenciasComoPerdido(): Collection
    {
        return $this->coincidenciasComoPerdido;
    }

    public function isEncontrado(): bool
    {
        return $this->tipo === self::TIPO_ENCONTRADO;
    }

    public function isPerdido(): bool
    {
        return $this->tipo === self::TIPO_PERDIDO;
    }

    public function isDisponible(): bool
    {
        return in_array($this->estado, [self::ESTADO_REGISTRADO, self::ESTADO_EN_ALMACEN]);
    }
}
