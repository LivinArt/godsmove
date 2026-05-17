'use server';

import { revalidatePath } from 'next/cache';
import { hasAdminBypass } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { serializePrisma } from '@/lib/serialize-prisma';
import { createClient } from '@/lib/supabase/server';
import {
  ConfirmReservationPaymentSchema,
  CreateReservationSchema,
  RefundParticipantsSchema,
  RunExclusiveDrawSchema,
  UnlockProductSchema,
  type ConfirmReservationPaymentInput,
  type CreateReservationInput,
  type RefundParticipantsInput,
  type RunExclusiveDrawInput,
  type UnlockProductInput,
} from '@/lib/validations/exclusive';

// ── HELPERS ─────────────────────────────────────────────────────────────────

async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function requireAdmin() {
  const bypass = await hasAdminBypass();
  if (bypass) return { id: 'bypass-admin' };

  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  const adminRoles = ['ADMIN', 'OPERATIONS', 'SUPPORT'];
  if (!profile || !adminRoles.includes(profile.role)) {
    throw new Error('FORBIDDEN');
  }

  return user;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function getOrCreateActiveDraw(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      isExclusiveUnlock: true,
      countdownDurationDays: true,
      winnerCount: true,
      status: true,
    },
  });

  if (!product?.isExclusiveUnlock) {
    throw new Error('Product is not an exclusive unlock item');
  }

  let draw = await prisma.exclusiveDraw.findFirst({
    where: {
      productId,
      status: { in: ['OPEN', 'CLOSED'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!draw) {
    const startsAt = new Date();
    draw = await prisma.exclusiveDraw.create({
      data: {
        productId,
        startsAt,
        endsAt: addDays(startsAt, product.countdownDurationDays),
        winnerCount: product.winnerCount,
        status: 'OPEN',
      },
    });
  }

  return draw;
}

async function creditWalletForReservation(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  profileId: string,
  amount: number,
  reservationId: string,
  description: string
) {
  let wallet = await tx.wallet.findUnique({ where: { profileId } });
  if (!wallet) {
    wallet = await tx.wallet.create({ data: { profileId } });
  }

  await tx.wallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: amount } },
  });

  await tx.walletTransaction.create({
    data: {
      walletId: wallet.id,
      amount,
      type: 'CREDIT_EXCLUSIVE_DRAW',
      description,
      exclusiveReservationId: reservationId,
    },
  });
}

// ── UNLOCK ───────────────────────────────────────────────────────────────────

export async function unlockProduct(input: UnlockProductInput) {
  const { productId } = UnlockProductSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, status: true, isExclusiveUnlock: true, slug: true },
  });

  if (!product || product.status !== 'ACTIVE') {
    throw new Error('Product not available');
  }
  if (!product.isExclusiveUnlock) {
    throw new Error('This product does not require unlocking');
  }

  const existing = await prisma.productUnlock.findUnique({
    where: { profileId_productId: { profileId: user.id, productId } },
  });

  if (existing) {
    return serializePrisma(existing);
  }

  const unlock = await prisma.$transaction(async (tx) => {
    const created = await tx.productUnlock.create({
      data: { profileId: user.id, productId },
    });

    const draw = await tx.exclusiveDraw.findFirst({
      where: { productId, status: { in: ['OPEN', 'CLOSED'] } },
    });

    if (!draw) {
      const p = await tx.product.findUnique({
        where: { id: productId },
        select: { countdownDurationDays: true, winnerCount: true },
      });
      if (p) {
        const startsAt = new Date();
        await tx.exclusiveDraw.create({
          data: {
            productId,
            startsAt,
            endsAt: addDays(startsAt, p.countdownDurationDays),
            winnerCount: p.winnerCount,
            status: 'OPEN',
          },
        });
      }
    }

    return created;
  });

  revalidatePath(`/product/${product.slug}`);
  revalidatePath('/profile');
  return serializePrisma(unlock);
}

export async function getProductUnlockStatus(productId: string) {
  const user = await getCurrentUser();
  if (!user) return { unlocked: false, reservation: null };

  const [unlock, reservation] = await Promise.all([
    prisma.productUnlock.findUnique({
      where: { profileId_productId: { profileId: user.id, productId } },
    }),
    prisma.exclusiveReservation.findFirst({
      where: {
        profileId: user.id,
        draw: { productId },
        status: { in: ['PENDING', 'PAID', 'WINNER', 'NON_WINNER'] },
      },
      include: { draw: true, winnerRecord: true },
    }),
  ]);

  return serializePrisma({
    unlocked: !!unlock,
    unlockedAt: unlock?.unlockedAt ?? null,
    reservation,
  });
}

export async function getUnlockedProducts() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const unlocks = await prisma.productUnlock.findMany({
    where: { profileId: user.id },
    include: {
      product: {
        include: {
          images: { orderBy: { position: 'asc' }, take: 1 },
          variants: { where: { isActive: true }, take: 1 },
          exclusiveDraws: {
            where: { status: { in: ['OPEN', 'CLOSED', 'COMPLETED'] } },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: { unlockedAt: 'desc' },
  });

  return serializePrisma(unlocks);
}

// ── RESERVATIONS ─────────────────────────────────────────────────────────────

export async function createReservation(input: CreateReservationInput) {
  const { productId, variantId } = CreateReservationSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slug: true,
      isExclusiveUnlock: true,
      reservationPrice: true,
      status: true,
    },
  });

  if (!product?.isExclusiveUnlock || product.status !== 'ACTIVE') {
    throw new Error('Exclusive reservation not available');
  }

  const unlock = await prisma.productUnlock.findUnique({
    where: { profileId_productId: { profileId: user.id, productId } },
  });
  if (!unlock) throw new Error('Unlock access before reserving');

  const reservationPrice = Number(product.reservationPrice);
  if (!reservationPrice || reservationPrice <= 0) {
    throw new Error('Invalid reservation price');
  }

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId, isActive: true },
  });
  if (!variant) throw new Error('Invalid variant selected');

  const draw = await getOrCreateActiveDraw(productId);

  if (draw.status !== 'OPEN') {
    throw new Error('Reservation window is closed');
  }
  if (new Date() > draw.endsAt) {
    await prisma.exclusiveDraw.update({
      where: { id: draw.id },
      data: { status: 'CLOSED' },
    });
    throw new Error('Countdown has ended — reservations are closed');
  }

  const existing = await prisma.exclusiveReservation.findUnique({
    where: { drawId_profileId: { drawId: draw.id, profileId: user.id } },
  });

  if (existing && ['PAID', 'WINNER', 'NON_WINNER', 'PENDING'].includes(existing.status)) {
    if (existing.status === 'PENDING') {
      return serializePrisma({
        reservation: existing,
        amount: reservationPrice,
        message: 'Complete your pending reservation payment',
      });
    }
    throw new Error('You have already reserved this drop');
  }

  const reservation = await prisma.exclusiveReservation.create({
    data: {
      drawId: draw.id,
      profileId: user.id,
      variantId,
      amount: reservationPrice,
      status: 'PENDING',
    },
  });

  revalidatePath(`/product/${product.slug}`);
  return serializePrisma({
    reservation,
    amount: reservationPrice,
  });
}

export async function confirmReservationPayment(input: ConfirmReservationPaymentInput) {
  const data = ConfirmReservationPaymentSchema.parse(input);
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  return prisma.$transaction(async (tx) => {
    const reservation = await tx.exclusiveReservation.findUnique({
      where: { id: data.reservationId },
      include: { draw: { include: { product: { select: { slug: true } } } } },
    });

    if (!reservation || reservation.profileId !== user.id) {
      throw new Error('Reservation not found');
    }
    if (reservation.status === 'PAID') {
      return serializePrisma(reservation);
    }
    if (reservation.status !== 'PENDING') {
      throw new Error('Reservation cannot be confirmed');
    }

    const updated = await tx.exclusiveReservation.update({
      where: { id: reservation.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        razorpayOrderId: data.razorpayOrderId,
        razorpayPaymentId: data.razorpayPaymentId,
      },
    });

    revalidatePath(`/product/${reservation.draw.product.slug}`);
    revalidatePath('/profile');
    return serializePrisma(updated);
  });
}

// ── DRAW ─────────────────────────────────────────────────────────────────────

export async function getActiveDraw(productId: string) {
  const draw = await prisma.exclusiveDraw.findFirst({
    where: {
      productId,
      status: { in: ['OPEN', 'CLOSED'] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          isExclusiveUnlock: true,
          reservationPrice: true,
          winnerCount: true,
          refundWinnersToWallet: true,
          refundNonWinnersToWallet: true,
        },
      },
      _count: { select: { reservations: { where: { status: 'PAID' } } } },
    },
  });

  return draw ? serializePrisma(draw) : null;
}

export async function runExclusiveDraw(input: RunExclusiveDrawInput) {
  await requireAdmin();
  const { drawId } = RunExclusiveDrawSchema.parse(input);
  return resolveDraw(drawId);
}

async function resolveDraw(drawId: string) {
  return prisma.$transaction(async (tx) => {
    const draw = await tx.exclusiveDraw.findUnique({
      where: { id: drawId },
      include: {
        product: true,
        winners: true,
      },
    });

    if (!draw) throw new Error('Draw not found');

    if (draw.status === 'COMPLETED') {
      return serializePrisma({
        draw,
        winners: draw.winners,
        message: 'Draw already completed',
        alreadyCompleted: true,
      });
    }

    const paidReservations = await tx.exclusiveReservation.findMany({
      where: { drawId, status: 'PAID' },
    });

    if (paidReservations.length === 0) {
      await tx.exclusiveDraw.update({
        where: { id: drawId },
        data: { status: 'COMPLETED', drawnAt: new Date() },
      });
      return serializePrisma({
        draw: { ...draw, status: 'COMPLETED' },
        winners: [],
        message: 'No paid reservations to draw from',
      });
    }

    const winnerCount = Math.min(draw.winnerCount, paidReservations.length);
    const shuffled = shuffleArray(paidReservations);
    const winnerReservations = shuffled.slice(0, winnerCount);
    const winnerIds = new Set(winnerReservations.map((r) => r.id));

    const createdWinners = [];

    for (const reservation of winnerReservations) {
      const winner = await tx.exclusiveDrawWinner.create({
        data: {
          drawId,
          reservationId: reservation.id,
          profileId: reservation.profileId,
        },
      });
      createdWinners.push(winner);

      await tx.exclusiveReservation.update({
        where: { id: reservation.id },
        data: { status: 'WINNER' },
      });

      if (draw.product.refundWinnersToWallet) {
        const amount = Number(reservation.amount);
        await creditWalletForReservation(
          tx,
          reservation.profileId,
          amount,
          reservation.id,
          `Exclusive draw winner credit — ${draw.product.name}`
        );
        await tx.exclusiveDrawWinner.update({
          where: { id: winner.id },
          data: { walletCredited: true },
        });
      }
    }

    for (const reservation of paidReservations) {
      if (winnerIds.has(reservation.id)) continue;

      await tx.exclusiveReservation.update({
        where: { id: reservation.id },
        data: { status: 'NON_WINNER' },
      });

      if (draw.product.refundNonWinnersToWallet) {
        const amount = Number(reservation.amount);
        await creditWalletForReservation(
          tx,
          reservation.profileId,
          amount,
          reservation.id,
          `Exclusive draw participation credit — ${draw.product.name}`
        );
      }
    }

    const updatedDraw = await tx.exclusiveDraw.update({
      where: { id: drawId },
      data: {
        status: 'COMPLETED',
        drawnAt: new Date(),
      },
      include: {
        winners: { include: { profile: { select: { email: true, firstName: true } } } },
        product: { select: { slug: true, name: true } },
      },
    });

    revalidatePath('/admin/exclusive-draws');
    revalidatePath(`/product/${draw.product.slug}`);
    revalidatePath('/profile');

    return serializePrisma({
      draw: updatedDraw,
      winners: createdWinners,
      participantCount: paidReservations.length,
      alreadyCompleted: false,
    });
  });
}

export async function refundParticipants(input: RefundParticipantsInput) {
  await requireAdmin();
  const { drawId, reservationIds } = RefundParticipantsSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    const draw = await tx.exclusiveDraw.findUnique({
      where: { id: drawId },
      include: { product: true },
    });
    if (!draw) throw new Error('Draw not found');

    const reservations = await tx.exclusiveReservation.findMany({
      where: {
        drawId,
        status: { in: ['PAID', 'WINNER', 'NON_WINNER'] },
        ...(reservationIds?.length ? { id: { in: reservationIds } } : {}),
      },
    });

    let credited = 0;

    for (const reservation of reservations) {
      const existingCredit = await tx.walletTransaction.findFirst({
        where: {
          exclusiveReservationId: reservation.id,
          type: 'CREDIT_EXCLUSIVE_DRAW',
        },
      });

      if (existingCredit) continue;

      const amount = Number(reservation.amount);
      await creditWalletForReservation(
        tx,
        reservation.profileId,
        amount,
        reservation.id,
        `Manual exclusive draw credit reissue — ${draw.product.name}`
      );
      credited++;
    }

    revalidatePath('/admin/exclusive-draws');
    return { credited, total: reservations.length };
  });
}

// ── DASHBOARD & ADMIN ────────────────────────────────────────────────────────

export async function getExclusiveDashboardData() {
  const user = await getCurrentUser();
  if (!user) throw new Error('UNAUTHORIZED');

  const [unlocks, reservations, wallet] = await Promise.all([
    prisma.productUnlock.findMany({
      where: { profileId: user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { position: 'asc' }, take: 1 },
            exclusiveDraws: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { unlockedAt: 'desc' },
    }),
    prisma.exclusiveReservation.findMany({
      where: { profileId: user.id },
      include: {
        draw: { include: { product: { select: { name: true, slug: true, images: { take: 1 } } } } },
        variant: { select: { size: true } },
        winnerRecord: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.wallet.findUnique({
      where: { profileId: user.id },
      include: {
        transactions: {
          where: { type: 'CREDIT_EXCLUSIVE_DRAW' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    }),
  ]);

  return serializePrisma({ unlocks, reservations, wallet });
}

export async function getAdminExclusiveDraws(params?: {
  status?: string;
  take?: number;
  skip?: number;
}) {
  await requireAdmin();

  const draws = await prisma.exclusiveDraw.findMany({
    where: {
      ...(params?.status && { status: params.status as any }),
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { take: 1, orderBy: { position: 'asc' } },
          reservationPrice: true,
        },
      },
      _count: {
        select: {
          reservations: true,
          winners: true,
        },
      },
      reservations: {
        where: { status: 'PAID' },
        select: { id: true },
      },
    },
    orderBy: { endsAt: 'desc' },
    take: params?.take ?? 20,
    skip: params?.skip ?? 0,
  });

  const total = await prisma.exclusiveDraw.count({
    where: params?.status ? { status: params.status as any } : undefined,
  });

  return serializePrisma({ draws, total });
}

export async function getAdminDrawDetail(drawId: string) {
  await requireAdmin();

  const draw = await prisma.exclusiveDraw.findUnique({
    where: { id: drawId },
    include: {
      product: true,
      reservations: {
        include: {
          profile: { select: { id: true, email: true, firstName: true, lastName: true } },
          variant: { select: { size: true, sku: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      winners: {
        include: {
          profile: { select: { email: true, firstName: true } },
          reservation: true,
        },
      },
    },
  });

  return draw ? serializePrisma(draw) : null;
}

/** Close expired draws and auto-resolve — safe to call from cron */
export async function processExpiredExclusiveDraws() {
  const now = new Date();

  const expiredDraws = await prisma.exclusiveDraw.findMany({
    where: {
      status: 'OPEN',
      endsAt: { lte: now },
    },
    select: { id: true },
  });

  const results = [];

  for (const { id } of expiredDraws) {
    await prisma.exclusiveDraw.update({
      where: { id },
      data: { status: 'CLOSED' },
    });

    try {
      const result = await resolveDraw(id);
      results.push({ drawId: id, success: true, result });
    } catch (err) {
      results.push({ drawId: id, success: false, error: String(err) });
    }
  }

  return { processed: results.length, results };
}

export async function syncExclusiveDrawForProduct(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      isExclusiveUnlock: true,
      countdownDurationDays: true,
      winnerCount: true,
      status: true,
    },
  });

  if (!product?.isExclusiveUnlock || product.status !== 'ACTIVE') return null;

  const existing = await prisma.exclusiveDraw.findFirst({
    where: { productId, status: { in: ['OPEN', 'CLOSED'] } },
  });

  if (existing) {
    return prisma.exclusiveDraw.update({
      where: { id: existing.id },
      data: { winnerCount: product.winnerCount },
    });
  }

  const startsAt = new Date();
  return prisma.exclusiveDraw.create({
    data: {
      productId,
      startsAt,
      endsAt: addDays(startsAt, product.countdownDurationDays),
      winnerCount: product.winnerCount,
      status: 'OPEN',
    },
  });
}
