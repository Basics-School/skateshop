"use server"

import { unstable_noStore as noStore, revalidatePath } from "next/cache"
import { db } from "@/db"
import { products, stores, type Store } from "@/db/schema"
import { and, asc, desc, eq, isNull, not, sql } from "drizzle-orm"
import { z } from "zod"

import { slugify } from "@/lib/utils"
import { getStoresSchema, storeSchema } from "@/lib/validations/store"

export async function getStoresAction(
  rawInput: z.infer<typeof getStoresSchema>
) {
  try {
    noStore()
    const input = getStoresSchema.parse(rawInput)

    const limit = input.limit ?? 10
    const offset = input.offset ?? 0
    const [column, order] =
      (input.sort?.split(".") as [
        keyof Store | undefined,
        "asc" | "desc" | undefined,
      ]) ?? []
    const statuses = input.statuses?.split(".") ?? []

    const { items, count } = await db.transaction(async (tx) => {
      const items = await tx
        .select({
          id: stores.id,
          name: stores.name,
          description: stores.description,
          stripeAccountId: stores.stripeAccountId,
          productCount: sql<number>`count(*)`,
        })
        .from(stores)
        .limit(limit)
        .offset(offset)
        .leftJoin(products, eq(stores.id, products.storeId))
        .where(
          and(
            input.userId ? eq(stores.userId, input.userId) : undefined,
            statuses.includes("active") && !statuses.includes("inactive")
              ? not(isNull(stores.stripeAccountId))
              : undefined,
            statuses.includes("inactive") && !statuses.includes("active")
              ? isNull(stores.stripeAccountId)
              : undefined
          )
        )
        .groupBy(stores.id)
        .orderBy(
          input.sort === "stripeAccountId.asc"
            ? asc(stores.stripeAccountId)
            : input.sort === "stripeAccountId.desc"
              ? desc(stores.stripeAccountId)
              : input.sort === "productCount.asc"
                ? asc(sql<number>`count(*)`)
                : input.sort === "productCount.desc"
                  ? desc(sql<number>`count(*)`)
                  : column && column in stores
                    ? order === "asc"
                      ? asc(stores[column])
                      : desc(stores[column])
                    : desc(stores.createdAt)
        )

      const count = await tx
        .select({
          count: sql<number>`count(*)`,
        })
        .from(stores)
        .where(
          and(
            input.userId ? eq(stores.userId, input.userId) : undefined,
            statuses.includes("active") && !statuses.includes("inactive")
              ? not(isNull(stores.stripeAccountId))
              : undefined,
            statuses.includes("inactive") && !statuses.includes("active")
              ? isNull(stores.stripeAccountId)
              : undefined
          )
        )
        .execute()
        .then((res) => res[0]?.count ?? 0)

      return {
        items,
        count,
      }
    })

    return {
      items,
      count,
    }
  } catch (err) {
    console.error(err)
    throw err instanceof Error
      ? err.message
      : err instanceof z.ZodError
        ? err.issues.map((issue) => issue.message).join("\n")
        : new Error("Unknown error.")
  }
}

const extendedStoreSchema = storeSchema.extend({
  userId: z.string(),
})

export async function addStoreAction(
  rawInput: z.infer<typeof extendedStoreSchema>
) {
  const input = extendedStoreSchema.parse(rawInput)

  const storeWithSameName = await db.query.stores.findFirst({
    where: eq(stores.name, input.name),
  })

  if (storeWithSameName) {
    throw new Error("Store name already taken.")
  }

  await db.insert(stores).values({
    name: input.name,
    description: input.description,
    userId: input.userId,
    slug: slugify(input.name),
  })

  revalidatePath("/dashboard/stores")
}
