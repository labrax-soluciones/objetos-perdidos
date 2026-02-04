<?php

namespace App\Repository;

use App\Entity\Coincidencia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Coincidencia>
 */
class CoincidenciaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Coincidencia::class);
    }

    public function save(Coincidencia $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Coincidencia[]
     */
    public function findByAyuntamiento(int $ayuntamientoId, ?string $estado = null): array
    {
        $qb = $this->createQueryBuilder('c')
            ->join('c.objetoEncontrado', 'oe')
            ->where('oe.ayuntamiento = :ayuntamientoId')
            ->setParameter('ayuntamientoId', $ayuntamientoId);

        if ($estado) {
            $qb->andWhere('c.estado = :estado')
               ->setParameter('estado', $estado);
        }

        return $qb->orderBy('c.puntuacion', 'DESC')
            ->addOrderBy('c.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Coincidencia[]
     */
    public function findPendientesByAyuntamiento(int $ayuntamientoId): array
    {
        return $this->findByAyuntamiento($ayuntamientoId, Coincidencia::ESTADO_PENDIENTE);
    }

    public function countPendientes(int $ayuntamientoId): int
    {
        return (int) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->join('c.objetoEncontrado', 'oe')
            ->where('oe.ayuntamiento = :ayuntamientoId')
            ->andWhere('c.estado = :estado')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->setParameter('estado', Coincidencia::ESTADO_PENDIENTE)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function existeCoincidencia(int $objetoEncontradoId, int $objetoPerdidoId): bool
    {
        return (bool) $this->createQueryBuilder('c')
            ->select('COUNT(c.id)')
            ->where('c.objetoEncontrado = :encontradoId')
            ->andWhere('c.objetoPerdido = :perdidoId')
            ->setParameter('encontradoId', $objetoEncontradoId)
            ->setParameter('perdidoId', $objetoPerdidoId)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
