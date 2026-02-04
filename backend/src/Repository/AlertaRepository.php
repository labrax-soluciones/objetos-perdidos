<?php

namespace App\Repository;

use App\Entity\Alerta;
use App\Entity\Objeto;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Alerta>
 */
class AlertaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Alerta::class);
    }

    public function save(Alerta $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Alerta $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Alerta[]
     */
    public function findByCiudadano(int $ciudadanoId): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.ciudadano = :ciudadanoId')
            ->setParameter('ciudadanoId', $ciudadanoId)
            ->orderBy('a.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find alerts that match a new found object
     * @return Alerta[]
     */
    public function findMatchingAlertas(Objeto $objeto): array
    {
        $alertas = $this->createQueryBuilder('a')
            ->where('a.activa = true')
            ->getQuery()
            ->getResult();

        $matching = [];
        foreach ($alertas as $alerta) {
            if ($this->alertaCoincideConObjeto($alerta, $objeto)) {
                $matching[] = $alerta;
            }
        }

        return $matching;
    }

    private function alertaCoincideConObjeto(Alerta $alerta, Objeto $objeto): bool
    {
        $criterios = $alerta->getCriterios();

        if (isset($criterios['categoria_id']) && $objeto->getCategoria()) {
            if ($criterios['categoria_id'] !== $objeto->getCategoria()->getId()) {
                return false;
            }
        }

        if (isset($criterios['color']) && $objeto->getColor()) {
            if (stripos($objeto->getColor(), $criterios['color']) === false) {
                return false;
            }
        }

        if (isset($criterios['palabras_clave']) && is_array($criterios['palabras_clave'])) {
            $textoObjeto = strtolower($objeto->getTitulo() . ' ' . $objeto->getDescripcion());
            $encontrada = false;
            foreach ($criterios['palabras_clave'] as $palabra) {
                if (stripos($textoObjeto, $palabra) !== false) {
                    $encontrada = true;
                    break;
                }
            }
            if (!$encontrada) {
                return false;
            }
        }

        return true;
    }
}
