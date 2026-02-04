<?php

namespace App\Repository;

use App\Entity\DispositivoPush;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DispositivoPush>
 */
class DispositivoPushRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DispositivoPush::class);
    }

    public function save(DispositivoPush $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(DispositivoPush $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByToken(string $token): ?DispositivoPush
    {
        return $this->findOneBy(['token' => $token]);
    }

    /**
     * @return DispositivoPush[]
     */
    public function findActivosByUsuario(int $usuarioId): array
    {
        return $this->createQueryBuilder('d')
            ->where('d.usuario = :usuarioId')
            ->andWhere('d.activo = true')
            ->setParameter('usuarioId', $usuarioId)
            ->getQuery()
            ->getResult();
    }
}
