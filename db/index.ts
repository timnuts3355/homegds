import Dexie, { type Table } from "dexie";
import type { Product, HistoryEntry } from "@/types";

export class HomegdsDatabase extends Dexie {
  products!:  Table<Product,      number>;
  histories!: Table<HistoryEntry, number>;

  constructor() {
    super("homegdsDB");

    this.version(1).stores({
      products: "++id, name, category, quantity, unit, createdAt, updatedAt",
    });
    this.version(2).stores({
      products: "++id, name, category, quantity, unit, minStock, createdAt, updatedAt",
    }).upgrade((tx) =>
      tx.table("products").toCollection().modify((p) => {
        if (p.minStock === undefined) p.minStock = 1;
      })
    );
    this.version(3).stores({
      products: "++id, name, category, quantity, unit, minStock, isFavorite, createdAt, updatedAt",
    }).upgrade((tx) =>
      tx.table("products").toCollection().modify((p) => {
        if (p.isFavorite === undefined) p.isFavorite = false;
      })
    );

    // v4: histories テーブル追加
    this.version(4).stores({
      products:  "++id, name, category, quantity, unit, minStock, isFavorite, createdAt, updatedAt",
      histories: "++id, productId, action, createdAt",
    });
  }
}

let _db: HomegdsDatabase | null = null;

export function getDb(): HomegdsDatabase {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB はクライアントサイドでのみ使用できます");
  }
  if (!_db) _db = new HomegdsDatabase();
  return _db;
}

export type { Product, HistoryEntry };
