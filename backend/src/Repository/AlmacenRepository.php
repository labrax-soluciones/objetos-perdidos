<?php

namespace App\Repository;

use App\Entity\Almacen;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Almacen>
 */
class AlmacenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Almacen::class);
    }

    public function save(Almacen $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Almacen[]
     */
    public function findByAyuntamiento(int $ayuntamientoId): array
    {
        return $this->createQueryBuilder('a')
            ->where('a.ayuntamiento = :ayuntamientoId')
            ->andWhere('a.activo = true')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->orderBy('a.nombre', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
