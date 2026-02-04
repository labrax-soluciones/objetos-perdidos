<?php

namespace App\Repository;

use App\Entity\Subasta;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Subasta>
 */
class SubastaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Subasta::class);
    }

    public function save(Subasta $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Subasta[]
     */
    public function findActivas(): array
    {
        $now = new \DateTime();

        return $this->createQueryBuilder('s')
            ->where('s.estado = :estado')
            ->andWhere('s.fechaInicio <= :now')
            ->andWhere('s.fechaFin >= :now')
            ->setParameter('estado', Subasta::ESTADO_ACTIVA)
            ->setParameter('now', $now)
            ->orderBy('s.fechaFin', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Subasta[]
     */
    public function findPublicas(): array
    {
        return $this->createQueryBuilder('s')
            ->where('s.estado IN (:estados)')
            ->setParameter('estados', [Subasta::ESTADO_ACTIVA, Subasta::ESTADO_PROGRAMADA])
            ->orderBy('s.fechaInicio', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Subasta[]
     */
    public function findParaCerrar(): array
    {
        $now = new \DateTime();

        return $this->createQueryBuilder('s')
            ->where('s.estado = :estado')
            ->andWhere('s.fechaFin < :now')
            ->setParameter('estado', Subasta::ESTADO_ACTIVA)
            ->setParameter('now', $now)
            ->getQuery()
            ->getResult();
    }
}
