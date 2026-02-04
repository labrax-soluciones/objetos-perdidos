<?php

namespace App\Repository;

use App\Entity\Solicitud;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Solicitud>
 */
class SolicitudRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Solicitud::class);
    }

    public function save(Solicitud $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Solicitud[]
     */
    public function findByAyuntamiento(int $ayuntamientoId, ?string $estado = null): array
    {
        $qb = $this->createQueryBuilder('s')
            ->join('s.objeto', 'o')
            ->where('o.ayuntamiento = :ayuntamientoId')
            ->setParameter('ayuntamientoId', $ayuntamientoId);

        if ($estado) {
            $qb->andWhere('s.estado = :estado')
               ->setParameter('estado', $estado);
        }

        return $qb->orderBy('s.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Solicitud[]
     */
    public function findByCiudadano(int $ciudadanoId): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.ciudadano = :ciudadanoId')
            ->setParameter('ciudadanoId', $ciudadanoId)
            ->orderBy('s.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function countPendientes(int $ayuntamientoId): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('COUNT(s.id)')
            ->join('s.objeto', 'o')
            ->where('o.ayuntamiento = :ayuntamientoId')
            ->andWhere('s.estado = :estado')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->setParameter('estado', Solicitud::ESTADO_PENDIENTE)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
