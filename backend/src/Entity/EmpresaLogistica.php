<?php

namespace App\Entity;

use App\Repository\EmpresaLogisticaRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: EmpresaLogisticaRepository::class)]
#[ORM\Table(name: 'empresas_logisticas')]
class EmpresaLogistica
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['empresa_logistica:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Groups(['empresa_logistica:read', 'empresa_logistica:write'])]
    private ?string $nombre = null;

    #[ORM\Column(length: 20)]
    #[Groups(['empresa_logistica:read', 'empresa_logistica:write'])]
    private ?string $cif = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['empresa_logistica:read', 'empresa_logistica:write'])]
    private ?string $contacto = null;

    #[ORM\Column(length: 20, nullable: true)]
    #[Groups(['empresa_logistica:read', 'empresa_logistica:write'])]
    private ?string $telefono = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Email]
    #[Groups(['empresa_logistica:read', 'empresa_logistica:write'])]
    private ?string $email = null;

    #[ORM\ManyToMany(targetEntity: Ayuntamiento::class, inversedBy: 'empresasLogisticas')]
    #[ORM\JoinTable(name: 'empresa_logistica_ayuntamiento')]
    private Collection $ayuntamientos;

    #[ORM\Column(type: 'boolean')]
    #[Groups(['empresa_logistica:read', 'empresa_logistica:write'])]
    private bool $activa = true;

    #[ORM\OneToMany(targetEntity: Envio::class, mappedBy: 'empresa')]
    private Collection $envios;

    public function __construct()
    {
        $this->ayuntamientos = new ArrayCollection();
        $this->envios = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getCif(): ?string
    {
        return $this->cif;
    }

    public function setCif(string $cif): static
    {
        $this->cif = $cif;
        return $this;
    }

    public function getContacto(): ?string
    {
        return $this->contacto;
    }

    public function setContacto(?string $contacto): static
    {
        $this->contacto = $contacto;
        return $this;
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

    public function getEmail(): ?string
    {
        return $this->email;
    }

    public function setEmail(?string $email): static
    {
        $this->email = $email;
        return $this;
    }

    /**
     * @return Collection<int, Ayuntamiento>
     */
    public function getAyuntamientos(): Collection
    {
        return $this->ayuntamientos;
    }

    public function addAyuntamiento(Ayuntamiento $ayuntamiento): static
    {
        if (!$this->ayuntamientos->contains($ayuntamiento)) {
            $this->ayuntamientos->add($ayuntamiento);
        }
        return $this;
    }

    public function removeAyuntamiento(Ayuntamiento $ayuntamiento): static
    {
        $this->ayuntamientos->removeElement($ayuntamiento);
        return $this;
    }

    public function isActiva(): bool
    {
        return $this->activa;
    }

    public function setActiva(bool $activa): static
    {
        $this->activa = $activa;
        return $this;
    }

    /**
     * @return Collection<int, Envio>
     */
    public function getEnvios(): Collection
    {
        return $this->envios;
    }
}
