import { prisma } from "@/lib/prisma";

/**
 * Fetches all uploads for a given user, newest first.
 */
export async function getUserUploads(userId: string) {
  return prisma.upload.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Deletes an upload record only if it belongs to the requesting user.
 * Throws if not found or ownership check fails.
 */
export async function deleteUpload(id: string, userId: string) {
  const record = await prisma.upload.findUnique({ where: { id } });
  if (!record) {
    throw new Error(`Upload ${id} not found`);
  }
  if (record.userId !== userId) {
    throw new Error(`Unauthorized: upload ${id} does not belong to user ${userId}`);
  }
  return prisma.upload.delete({ where: { id } });
}
