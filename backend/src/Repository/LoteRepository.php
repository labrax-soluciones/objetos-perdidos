<?php

namespace App\Repository;

use App\Entity\Lote;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Lote>
 */
class LoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Lote::class);
    }

    public function save(Lote $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Lote[]
     */
    public function findByAyuntamiento(int $ayuntamientoId): array
    {
        return $this->createQueryBuilder('l')
            ->where('l.ayuntamiento = :ayuntamientoId')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->orderBy('l.fechaCreacion', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
