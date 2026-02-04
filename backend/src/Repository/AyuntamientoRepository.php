<?php

namespace App\Repository;

use App\Entity\Ayuntamiento;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Ayuntamiento>
 */
class AyuntamientoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Ayuntamiento::class);
    }

    public function save(Ayuntamiento $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Ayuntamiento $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByCif(string $cif): ?Ayuntamiento
    {
        return $this->findOneBy(['cif' => $cif]);
    }
}
