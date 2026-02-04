<?php

namespace App\Repository;

use App\Entity\Usuario;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Component\Security\Core\Exception\UnsupportedUserException;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\PasswordUpgraderInterface;

/**
 * @extends ServiceEntityRepository<Usuario>
 */
class UsuarioRepository extends ServiceEntityRepository implements PasswordUpgraderInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Usuario::class);
    }

    public function save(Usuario $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(Usuario $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);
        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function upgradePassword(PasswordAuthenticatedUserInterface $user, string $newHashedPassword): void
    {
        if (!$user instanceof Usuario) {
            throw new UnsupportedUserException(sprintf('Instances of "%s" are not supported.', $user::class));
        }

        $user->setPassword($newHashedPassword);
        $this->save($user, true);
    }

    public function findByEmail(string $email): ?Usuario
    {
        return $this->findOneBy(['email' => $email]);
    }

    public function findByEmailVerificationToken(string $token): ?Usuario
    {
        return $this->findOneBy(['emailVerificationToken' => $token]);
    }

    public function findByPasswordResetToken(string $token): ?Usuario
    {
        return $this->createQueryBuilder('u')
            ->where('u.passwordResetToken = :token')
            ->andWhere('u.passwordResetTokenExpiresAt > :now')
            ->setParameter('token', $token)
            ->setParameter('now', new \DateTimeImmutable())
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * @return Usuario[]
     */
    public function findByAyuntamiento(int $ayuntamientoId): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.ayuntamiento = :ayuntamientoId')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->orderBy('u.nombre', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return Usuario[]
     */
    public function findAdminsByAyuntamiento(int $ayuntamientoId): array
    {
        return $this->createQueryBuilder('u')
            ->where('u.ayuntamiento = :ayuntamientoId')
            ->andWhere('u.tipo IN (:tipos)')
            ->setParameter('ayuntamientoId', $ayuntamientoId)
            ->setParameter('tipos', [Usuario::TIPO_ADMIN_MUNICIPAL, Usuario::TIPO_ADMIN_EXTERNO])
            ->orderBy('u.nombre', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
