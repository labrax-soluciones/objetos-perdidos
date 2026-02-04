<?php

namespace App\Repository;

use App\Entity\Puja;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Puja>
 */
class PujaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Puja::class);
    }

    public function save(Puja $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Puja[]
     */
    public function findBySubasta(int $subastaId): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.subasta = :subastaId')
            ->setParameter('subastaId', $subastaId)
            ->orderBy('p.cantidad', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Puja[]
     */
    public function findByUsuario(int $usuarioId): array
    {
        return $this->createQueryBuilder('p')
            ->join('p.subasta', 's')
            ->where('p.usuario = :usuarioId')
            ->setParameter('usuarioId', $usuarioId)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function getPujaMaxima(int $subastaId): ?Puja
    {
        return $this->createQueryBuilder('p')
            ->where('p.subasta = :subastaId')
            ->setParameter('subastaId', $subastaId)
            ->orderBy('p.cantidad', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
