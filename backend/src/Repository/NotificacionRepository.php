<?php

namespace App\Repository;

use App\Entity\Notificacion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Notificacion>
 */
class NotificacionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Notificacion::class);
    }

    public function save(Notificacion $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return Notificacion[]
     */
    public function findByUsuario(int $usuarioId, int $limit = 50): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.usuario = :usuarioId')
            ->setParameter('usuarioId', $usuarioId)
            ->orderBy('n.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Notificacion[]
     */
    public function findNoLeidasByUsuario(int $usuarioId): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.usuario = :usuarioId')
            ->andWhere('n.leida = false')
            ->setParameter('usuarioId', $usuarioId)
            ->orderBy('n.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    public function countNoLeidas(int $usuarioId): int
    {
        return (int) $this->createQueryBuilder('n')
            ->select('COUNT(n.id)')
            ->where('n.usuario = :usuarioId')
            ->andWhere('n.leida = false')
            ->setParameter('usuarioId', $usuarioId)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function marcarTodasComoLeidas(int $usuarioId): void
    {
        $this->createQueryBuilder('n')
            ->update()
            ->set('n.leida', 'true')
            ->set('n.fechaLectura', ':now')
            ->where('n.usuario = :usuarioId')
            ->andWhere('n.leida = false')
            ->setParameter('usuarioId', $usuarioId)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->execute();
    }
}
