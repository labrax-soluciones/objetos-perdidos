<?php

namespace App\Repository;

use App\Entity\EmpresaLogistica;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EmpresaLogistica>
 */
class EmpresaLogisticaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EmpresaLogistica::class);
    }

    public function save(EmpresaLogistica $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return EmpresaLogistica[]
     */
    public function findByAyuntamiento(int $ayuntamientoId): array
    {
        return $this->createQueryBuilder('e')
            ->join('e.ayuntamientos', 'a')
            ->where('a.id = :ayuntamientoId')
            ->andWhere('e.activa = true')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->orderBy('e.nombre', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
