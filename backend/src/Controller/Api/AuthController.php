<?php

namespace App\Controller\Api;

use App\Entity\Usuario;
use App\Repository\UsuarioRepository;
use App\Service\NotificacionService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UsuarioRepository $usuarioRepository,
        private UserPasswordHasherInterface $passwordHasher,
        private ValidatorInterface $validator,
        private NotificacionService $notificacionService
    ) {}

    #[Route('/login', name: 'api_auth_login', methods: ['POST'])]
    public function login(): JsonResponse
    {
        // This is handled by the JWT authentication
        // The actual authentication is done by lexik_jwt_authentication
        return $this->json(['message' => 'Check security.yaml for login configuration']);
    }

    #[Route('/register', name: 'api_auth_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['error' => 'Datos inválidos'], Response::HTTP_BAD_REQUEST);
        }

        // Check if email already exists
        if ($this->usuarioRepository->findByEmail($data['email'] ?? '')) {
            return $this->json(['error' => 'El email ya está registrado'], Response::HTTP_CONFLICT);
        }

        $usuario = new Usuario();
        $usuario->setEmail($data['email'] ?? '');
        $usuario->setNombre($data['nombre'] ?? '');
        $usuario->setApellidos($data['apellidos'] ?? null);
        $usuario->setTelefono($data['telefono'] ?? null);
        $usuario->setDni($data['dni'] ?? null);
        $usuario->setTipo(Usuario::TIPO_CIUDADANO);
        $usuario->setActivo(true);
        $usuario->setEmailVerificado(false);
        $usuario->setEmailVerificationToken(Uuid::v4()->toBase58());

        // Hash password
        $hashedPassword = $this->passwordHasher->hashPassword($usuario, $data['password'] ?? '');
        $usuario->setPassword($hashedPassword);

        // Validate
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

        // Send verification email
        $this->notificacionService->enviarEmailVerificacion($usuario);

        return $this->json([
            'message' => 'Usuario registrado correctamente. Por favor, verifica tu email.',
            'id' => $usuario->getId()
        ], Response::HTTP_CREATED);
    }

    #[Route('/verify-email/{token}', name: 'api_auth_verify_email', methods: ['GET'])]
    public function verifyEmail(string $token): JsonResponse
    {
        $usuario = $this->usuarioRepository->findByEmailVerificationToken($token);

        if (!$usuario) {
            return $this->json(['error' => 'Token de verificación inválido'], Response::HTTP_NOT_FOUND);
        }

        $usuario->setEmailVerificado(true);
        $usuario->setEmailVerificationToken(null);
        $this->em->flush();

        return $this->json(['message' => 'Email verificado correctamente']);
    }

    #[Route('/forgot-password', name: 'api_auth_forgot_password', methods: ['POST'])]
    public function forgotPassword(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $email = $data['email'] ?? '';

        $usuario = $this->usuarioRepository->findByEmail($email);

        // Always return success to prevent email enumeration
        if ($usuario) {
            $token = Uuid::v4()->toBase58();
            $usuario->setPasswordResetToken($token);
            $usuario->setPasswordResetTokenExpiresAt(new \DateTimeImmutable('+1 hour'));
            $this->em->flush();

            $this->notificacionService->enviarEmailRecuperacionPassword($usuario);
        }

        return $this->json([
            'message' => 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
        ]);
    }

    #[Route('/reset-password', name: 'api_auth_reset_password', methods: ['POST'])]
    public function resetPassword(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $token = $data['token'] ?? '';
        $newPassword = $data['password'] ?? '';

        if (strlen($newPassword) < 8) {
            return $this->json(['error' => 'La contraseña debe tener al menos 8 caracteres'], Response::HTTP_BAD_REQUEST);
        }

        $usuario = $this->usuarioRepository->findByPasswordResetToken($token);

        if (!$usuario) {
            return $this->json(['error' => 'Token inválido o expirado'], Response::HTTP_BAD_REQUEST);
        }

        $hashedPassword = $this->passwordHasher->hashPassword($usuario, $newPassword);
        $usuario->setPassword($hashedPassword);
        $usuario->setPasswordResetToken(null);
        $usuario->setPasswordResetTokenExpiresAt(null);
        $this->em->flush();

        return $this->json(['message' => 'Contraseña actualizada correctamente']);
    }

    #[Route('/refresh', name: 'api_auth_refresh', methods: ['POST'])]
    public function refresh(): JsonResponse
    {
        // Token refresh is handled by lexik_jwt_authentication_bundle
        // This endpoint can be configured in the bundle
        return $this->json(['message' => 'Token refresh not implemented yet']);
    }

    #[Route('/me', name: 'api_auth_me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'id' => $usuario->getId(),
            'email' => $usuario->getEmail(),
            'nombre' => $usuario->getNombre(),
            'apellidos' => $usuario->getApellidos(),
            'telefono' => $usuario->getTelefono(),
            'dni' => $usuario->getDni(),
            'tipo' => $usuario->getTipo(),
            'ayuntamiento' => $usuario->getAyuntamiento() ? [
                'id' => $usuario->getAyuntamiento()->getId(),
                'nombre' => $usuario->getAyuntamiento()->getNombre()
            ] : null,
            'emailVerificado' => $usuario->isEmailVerificado(),
            'roles' => $usuario->getRoles()
        ]);
    }

    #[Route('/update-profile', name: 'api_auth_update_profile', methods: ['PUT'])]
    public function updateProfile(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
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

        $errors = $this->validator->validate($usuario);
        if (count($errors) > 0) {
            $errorMessages = [];
            foreach ($errors as $error) {
                $errorMessages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json(['errors' => $errorMessages], Response::HTTP_BAD_REQUEST);
        }

        $this->em->flush();

        return $this->json(['message' => 'Perfil actualizado correctamente']);
    }

    #[Route('/change-password', name: 'api_auth_change_password', methods: ['POST'])]
    public function changePassword(Request $request): JsonResponse
    {
        /** @var Usuario $usuario */
        $usuario = $this->getUser();

        if (!$usuario) {
            return $this->json(['error' => 'No autenticado'], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);
        $currentPassword = $data['currentPassword'] ?? '';
        $newPassword = $data['newPassword'] ?? '';

        if (!$this->passwordHasher->isPasswordValid($usuario, $currentPassword)) {
            return $this->json(['error' => 'La contraseña actual es incorrecta'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($newPassword) < 8) {
            return $this->json(['error' => 'La nueva contraseña debe tener al menos 8 caracteres'], Response::HTTP_BAD_REQUEST);
        }

        $hashedPassword = $this->passwordHasher->hashPassword($usuario, $newPassword);
        $usuario->setPassword($hashedPassword);
        $this->em->flush();

        return $this->json(['message' => 'Contraseña cambiada correctamente']);
    }
}
