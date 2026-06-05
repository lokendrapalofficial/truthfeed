"use server";

import { prisma } from "@/lib/db";

export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        articles: true,
      }
    });
    return { success: true, user };
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return { success: false, error: error.message };
  }
}

export async function updateUserPreferences(userId: string, preferences: string[]) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { preferences },
    });
    return { success: true, user };
  } catch (error: any) {
    console.error("Error updating user preferences:", error);
    return { success: false, error: error.message };
  }
}
