<?php

namespace App\Controller\Api;

use App\Entity\Ayuntamiento;
use App\Entity\Usuario;
use App\Repository\AyuntamientoRepository;
use App\Repository\UsuarioRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/superadmin')]
class SuperadminController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private AyuntamientoRepository $ayuntamientoRepository,
        private UsuarioRepository $usuarioRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator
    ) {}

    #[Route('/ayuntamientos', name: 'api_superadmin_ayuntamientos_list', methods: ['GET'])]
    public function listAyuntamientos(): JsonResponse
    {
        $ayuntamientos = $this->ayuntamientoRepository->findAll();

        $data = [];
        foreach ($ayuntamientos as $ayuntamiento) {
            $data[] = [
                'id' => $ayuntamiento->getId(),
                'nombre' => $ayuntamiento->getNombre(),
                'cif' => $ayuntamiento->getCif(),
                'email' => $ayuntamiento->getEmail(),
                'telefono' => $ayuntamiento->getTelefono(),
                'direccion' => $ayuntamiento->getDireccion(),
                'numeroUsuarios' => $ayuntamiento->getUsuarios()->count(),
                'createdAt' => $ayuntamiento->getCreatedAt()?->format('c')
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/ayuntamientos', name: 'api_superadmin_ayuntamientos_create', methods: ['POST'])]
    public function createAyuntamiento(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        // Check if CIF already exists
        if ($this->ayuntamientoRepository->findByCif($data['cif'] ?? '')) {
            return $this->json(['error' => 'Ya existe un ayuntamiento con este CIF'], Response::HTTP_CONFLICT);
        }

        $ayuntamiento = new Ayuntamiento();
        $ayuntamiento->setNombre($data['nombre'] ?? '');
        $ayuntamiento->setCif($data['cif'] ?? '');
        $ayuntamiento->setDireccion($data['direccion'] ?? '');
        $ayuntamiento->setTelefono($data['telefono'] ?? null);
        $ayuntamiento->setEmail($data['email'] ?? '');
        $ayuntamiento->setConfiguracion($data['configuracion'] ?? null);

        $errors = $this->validator->validate($ayuntamiento);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($ayuntamiento);
        $this->em->flush();

        return $this->json([
            'message' => 'Ayuntamiento creado correctamente',
            'id' => $ayuntamiento->getId()
        ], Response::HTTP_CREATED);
    }

    #[Route('/ayuntamientos/{id}', name: 'api_superadmin_ayuntamientos_show', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function showAyuntamiento(int $id): JsonResponse
    {
        $ayuntamiento = $this->ayuntamientoRepository->find($id);

        if (!$ayuntamiento) {
            return $this->json(['error' => 'Ayuntamiento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id' => $ayuntamiento->getId(),
            'nombre' => $ayuntamiento->getNombre(),
            'cif' => $ayuntamiento->getCif(),
            'direccion' => $ayuntamiento->getDireccion(),
            'telefono' => $ayuntamiento->getTelefono(),
            'email' => $ayuntamiento->getEmail(),
            'configuracion' => $ayuntamiento->getConfiguracion(),
            'createdAt' => $ayuntamiento->getCreatedAt()?->format('c'),
            'updatedAt' => $ayuntamiento->getUpdatedAt()?->format('c')
        ]);
    }

    #[Route('/ayuntamientos/{id}', name: 'api_superadmin_ayuntamientos_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function updateAyuntamiento(int $id, Request $request): JsonResponse
    {
        $ayuntamiento = $this->ayuntamientoRepository->find($id);

        if (!$ayuntamiento) {
            return $this->json(['error' => 'Ayuntamiento no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nombre'])) {
            $ayuntamiento->setNombre($data['nombre']);
        }
        if (isset($data['direccion'])) {
            $ayuntamiento->setDireccion($data['direccion']);
        }
        if (isset($data['telefono'])) {
            $ayuntamiento->setTelefono($data['telefono']);
        }
        if (isset($data['email'])) {
            $ayuntamiento->setEmail($data['email']);
        }
        if (isset($data['configuracion'])) {
            $ayuntamiento->setConfiguracion($data['configuracion']);
        }

        $errors = $this->validator->validate($ayuntamiento);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->flush();

        return $this->json(['message' => 'Ayuntamiento actualizado correctamente']);
    }

    #[Route('/usuarios', name: 'api_superadmin_usuarios_list', methods: ['GET'])]
    public function listUsuarios(Request $request): JsonResponse
    {
        $ayuntamientoId = $request->query->get('ayuntamiento');
        $tipo = $request->query->get('tipo');

        $qb = $this->em->createQueryBuilder()
            ->select('u')
            ->from(Usuario::class, 'u')
            ->orderBy('u.createdAt', 'DESC');

        if ($ayuntamientoId) {
            $qb->andWhere('u.ayuntamiento = :ayuntamientoId')
               ->setParameter('ayuntamientoId', $ayuntamientoId);
        }

        if ($tipo) {
            $qb->andWhere('u.tipo = :tipo')
               ->setParameter('tipo', $tipo);
        }

        $usuarios = $qb->getQuery()->getResult();

        $data = [];
        foreach ($usuarios as $usuario) {
            $data[] = [
                'id' => $usuario->getId(),
                'email' => $usuario->getEmail(),
                'nombre' => $usuario->getNombreCompleto(),
                'tipo' => $usuario->getTipo(),
                'activo' => $usuario->isActivo(),
                'emailVerificado' => $usuario->isEmailVerificado(),
                'ayuntamiento' => $usuario->getAyuntamiento() ? [
                    'id' => $usuario->getAyuntamiento()->getId(),
                    'nombre' => $usuario->getAyuntamiento()->getNombre()
                ] : null,
                'createdAt' => $usuario->getCreatedAt()?->format('c')
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/usuarios', name: 'api_superadmin_usuarios_create', methods: ['POST'])]
    public function createUsuario(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if ($this->usuarioRepository->findByEmail($data['email'] ?? '')) {
            return $this->json(['error' => 'Ya existe un usuario con este email'], Response::HTTP_CONFLICT);
        }

        $usuario = new Usuario();
        $usuario->setEmail($data['email'] ?? '');
        $usuario->setNombre($data['nombre'] ?? '');
        $usuario->setApellidos($data['apellidos'] ?? null);
        $usuario->setTelefono($data['telefono'] ?? null);
        $usuario->setDni($data['dni'] ?? null);
        $usuario->setTipo($data['tipo'] ?? Usuario::TIPO_ADMIN_MUNICIPAL);
        $usuario->setActivo(true);
        $usuario->setEmailVerificado(true); // Admin-created users don't need verification

        if (isset($data['ayuntamientoId'])) {
            $ayuntamiento = $this->ayuntamientoRepository->find($data['ayuntamientoId']);
            if ($ayuntamiento) {
                $usuario->setAyuntamiento($ayuntamiento);
            }
        }

        $hashedPassword = $this->passwordHasher->hashPassword($usuario, $data['password'] ?? 'changeme123');
        $usuario->setPassword($hashedPassword);

        $errors = $this->validator->validate($usuario);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->persist($usuario);
        $this->em->flush();

        return $this->json([
            'message' => 'Usuario creado correctamente',
            'id' => $usuario->getId()
        ], Response::HTTP_CREATED);
    }

    #[Route('/usuarios/{id}', name: 'api_superadmin_usuarios_update', methods: ['PUT'], requirements: ['id' => '\d+'])]
    public function updateUsuario(int $id, Request $request): JsonResponse
    {
        $usuario = $this->usuarioRepository->find($id);

        if (!$usuario) {
            return $this->json(['error' => 'Usuario no encontrado'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nombre'])) {
            $usuario->setNombre($data['nombre']);
        }
        if (isset($data['apellidos'])) {
            $usuario->setApellidos($data['apellidos']);
        }
        if (isset($data['telefono'])) {
            $usuario->setTelefono($data['telefono']);
        }
        if (isset($data['tipo'])) {
            $usuario->setTipo($data['tipo']);
        }
        if (isset($data['activo'])) {
            $usuario->setActivo($data['activo']);
        }
        if (isset($data['ayuntamientoId'])) {
            $ayuntamiento = $this->ayuntamientoRepository->find($data['ayuntamientoId']);
            $usuario->setAyuntamiento($ayuntamiento);
        }
        if (isset($data['password']) && !empty($data['password'])) {
            $hashedPassword = $this->passwordHasher->hashPassword($usuario, $data['password']);
            $usuario->setPassword($hashedPassword);
        }

        $this->em->flush();

        return $this->json(['message' => 'Usuario actualizado correctamente']);
    }

    #[Route('/usuarios/{id}', name: 'api_superadmin_usuarios_delete', methods: ['DELETE'], requirements: ['id' => '\d+'])]
    public function deleteUsuario(int $id): JsonResponse
    {
        $usuario = $this->usuarioRepository->find($id);

        if (!$usuario) {
            return $this->json(['error' => 'Usuario no encontrado'], Response::HTTP_NOT_FOUND);
        }

        // Don't allow deleting superadmins
        if ($usuario->isSuperAdmin()) {
            return $this->json(['error' => 'No se puede eliminar un superadministrador'], Response::HTTP_FORBIDDEN);
        }

        // Soft delete - just deactivate
        $usuario->setActivo(false);
        $this->em->flush();

        return $this->json(['message' => 'Usuario desactivado correctamente']);
    }
}
