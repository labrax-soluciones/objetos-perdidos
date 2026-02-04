<?php

namespace App\Repository;

use App\Entity\Objeto;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\ORM\QueryBuilder;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Objeto>
 */
class ObjetoRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Objeto::class);
    }

    public function save(Objeto $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Objeto $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findByCodigoUnico(string $codigo): ?Objeto
    {
        return $this->findOneBy(['codigoUnico' => $codigo]);
    }

    public function createSearchQueryBuilder(array $filters = []): QueryBuilder
    {
        $qb = $this->createQueryBuilder('o')
            ->leftJoin('o.categoria', 'c')
            ->leftJoin('o.fotos', 'f')
            ->leftJoin('o.ayuntamiento', 'a');

        if (isset($filters['tipo'])) {
            $qb->andWhere('o.tipo = :tipo')
               ->setParameter('tipo', $filters['tipo']);
        }

        if (isset($filters['estado'])) {
            if (is_array($filters['estado'])) {
                $qb->andWhere('o.estado IN (:estados)')
                   ->setParameter('estados', $filters['estado']);
            } else {
                $qb->andWhere('o.estado = :estado')
                   ->setParameter('estado', $filters['estado']);
            }
        }

        if (isset($filters['ayuntamiento_id'])) {
            $qb->andWhere('o.ayuntamiento = :ayuntamientoId')
               ->setParameter('ayuntamientoId', $filters['ayuntamiento_id']);
        }

        if (isset($filters['categoria_id'])) {
            $qb->andWhere('o.categoria = :categoriaId')
               ->setParameter('categoriaId', $filters['categoria_id']);
        }

        if (isset($filters['color'])) {
            $qb->andWhere('LOWER(o.color) LIKE LOWER(:color)')
               ->setParameter('color', '%' . $filters['color'] . '%');
        }

        if (isset($filters['busqueda'])) {
            $qb->andWhere('(LOWER(o.titulo) LIKE LOWER(:busqueda) OR LOWER(o.descripcion) LIKE LOWER(:busqueda) OR LOWER(o.marca) LIKE LOWER(:busqueda) OR LOWER(o.modelo) LIKE LOWER(:busqueda))')
               ->setParameter('busqueda', '%' . $filters['busqueda'] . '%');
        }

        if (isset($filters['fecha_desde'])) {
            $qb->andWhere('o.fechaHallazgo >= :fechaDesde')
               ->setParameter('fechaDesde', $filters['fecha_desde']);
        }

        if (isset($filters['fecha_hasta'])) {
            $qb->andWhere('o.fechaHallazgo <= :fechaHasta')
               ->setParameter('fechaHasta', $filters['fecha_hasta']);
        }

        return $qb;
    }

    /**
     * @return Objeto[]
     */
    public function findObjetosPublicos(array $filters = [], int $page = 1, int $limit = 20): array
    {
        $filters['tipo'] = Objeto::TIPO_ENCONTRADO;
        $filters['estado'] = [Objeto::ESTADO_REGISTRADO, Objeto::ESTADO_EN_ALMACEN];

        return $this->createSearchQueryBuilder($filters)
            ->orderBy('o.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    public function countObjetosPublicos(array $filters = []): int
    {
        $filters['tipo'] = Objeto::TIPO_ENCONTRADO;
        $filters['estado'] = [Objeto::ESTADO_REGISTRADO, Objeto::ESTADO_EN_ALMACEN];

        return (int) $this->createSearchQueryBuilder($filters)
            ->select('COUNT(o.id)')
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return Objeto[]
     */
    public function findByUsuario(int $usuarioId): array
    {
        return $this->createQueryBuilder('o')
            ->where('o.usuarioReporta = :usuarioId')
            ->setParameter('usuarioId', $usuarioId)
            ->orderBy('o.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find objects eligible for auction (older than 2 years and not claimed)
     * @return Objeto[]
     */
    public function findEligiblesParaSubasta(int $ayuntamientoId): array
    {
        $fechaLimite = (new \DateTime())->modify('-2 years');

        return $this->createQueryBuilder('o')
            ->where('o.ayuntamiento = :ayuntamientoId')
            ->andWhere('o.tipo = :tipo')
            ->andWhere('o.estado IN (:estados)')
            ->andWhere('o.createdAt <= :fechaLimite')
            ->andWhere('o.lote IS NULL')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->setParameter('tipo', Objeto::TIPO_ENCONTRADO)
            ->setParameter('estados', [Objeto::ESTADO_EN_ALMACEN])
            ->setParameter('fechaLimite', $fechaLimite)
            ->orderBy('o.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return array<string, int>
     */
    public function getEstadisticasPorEstado(int $ayuntamientoId): array
    {
        $result = $this->createQueryBuilder('o')
            ->select('o.estado, COUNT(o.id) as total')
            ->where('o.ayuntamiento = :ayuntamientoId')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->groupBy('o.estado')
            ->getQuery()
            ->getResult();

        $estadisticas = [];
        foreach ($result as $row) {
            $estadisticas[$row['estado']] = (int) $row['total'];
        }

        return $estadisticas;
    }

    /**
     * Find potential matches for a lost object
     * @return Objeto[]
     */
    public function findPotencialesCoincidencias(Objeto $objetoPerdido): array
    {
        $qb = $this->createQueryBuilder('o')
            ->where('o.tipo = :tipo')
            ->andWhere('o.ayuntamiento = :ayuntamiento')
            ->andWhere('o.estado IN (:estados)')
            ->setParameter('tipo', Objeto::TIPO_ENCONTRADO)
            ->setParameter('ayuntamiento', $objetoPerdido->getAyuntamiento())
            ->setParameter('estados', [Objeto::ESTADO_REGISTRADO, Objeto::ESTADO_EN_ALMACEN]);

        if ($objetoPerdido->getCategoria()) {
            $qb->andWhere('o.categoria = :categoria')
               ->setParameter('categoria', $objetoPerdido->getCategoria());
        }

        if ($objetoPerdido->getColor()) {
            $qb->andWhere('LOWER(o.color) = LOWER(:color)')
               ->setParameter('color', $objetoPerdido->getColor());
        }

        if ($objetoPerdido->getFechaHallazgo()) {
            $fechaDesde = (clone $objetoPerdido->getFechaHallazgo())->modify('-7 days');
            $fechaHasta = (clone $objetoPerdido->getFechaHallazgo())->modify('+7 days');
            $qb->andWhere('o.fechaHallazgo BETWEEN :fechaDesde AND :fechaHasta')
               ->setParameter('fechaDesde', $fechaDesde)
               ->setParameter('fechaHasta', $fechaHasta);
        }

        return $qb->orderBy('o.createdAt', 'DESC')
            ->setMaxResults(50)
            ->getQuery()
            ->getResult();
    }
}
