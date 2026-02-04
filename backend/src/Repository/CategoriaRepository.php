<?php

namespace App\Repository;

use App\Entity\Categoria;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Categoria>
 */
class CategoriaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Categoria::class);
    }

    public function save(Categoria $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Categoria[]
     */
    public function findActivas(): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.activa = true')
            ->orderBy('c.orden', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Categoria[]
     */
    public function findRaices(): array
    {
        return $this->createQueryBuilder('c')
            ->where('c.padre IS NULL')
            ->andWhere('c.activa = true')
            ->orderBy('c.orden', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
