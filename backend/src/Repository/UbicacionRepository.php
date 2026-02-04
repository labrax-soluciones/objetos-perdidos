<?php

namespace App\Repository;

use App\Entity\Ubicacion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Ubicacion>
 */
class UbicacionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ubicacion::class);
    }

    public function save(Ubicacion $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Ubicacion[]
     */
    public function findByAlmacen(int $almacenId): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.almacen = :almacenId')
            ->setParameter('almacenId', $almacenId)
            ->orderBy('u.codigo', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Ubicacion[]
     */
    public function findDisponibles(int $almacenId): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.almacen = :almacenId')
            ->andWhere('u.capacidad IS NULL OR u.ocupacionActual < u.capacidad')
            ->setParameter('almacenId', $almacenId)
            ->orderBy('u.codigo', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
