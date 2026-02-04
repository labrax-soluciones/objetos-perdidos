<?php

namespace App\Repository;

use App\Entity\MovimientoObjeto;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MovimientoObjeto>
 */
class MovimientoObjetoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MovimientoObjeto::class);
    }

    public function save(MovimientoObjeto $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return MovimientoObjeto[]
     */
    public function findByObjeto(int $objetoId): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.objeto = :objetoId')
            ->setParameter('objetoId', $objetoId)
            ->orderBy('m.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
