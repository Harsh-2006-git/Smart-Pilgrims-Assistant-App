import { sequelize } from "../config/database.js";

const STATUS_VALUES = [
  "Pending",
  "Confirmed",
  "Rejected",
  "CheckedIn",
  "Completed",
  "Cancelled",
];

const buildEnumSql = (values) => values.map((value) => `'${value}'`).join(",");

export const ensureStayBookingSchema = async () => {
  try {
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'stay_bookings'");
    if (!tables?.length) {
      return;
    }

    const [columns] = await sequelize.query("SHOW COLUMNS FROM stay_bookings LIKE 'status'");
    if (!columns?.length) {
      return;
    }

    const column = columns[0];
    const currentType = String(column.Type || "");

    if (currentType.includes("'Rejected'")) {
      return;
    }

    const nullClause = column.Null === "YES" ? "NULL" : "NOT NULL";
    const currentDefault = column.Default;
    const safeDefault = STATUS_VALUES.includes(currentDefault) ? currentDefault : "Pending";

    await sequelize.query(
      `ALTER TABLE stay_bookings MODIFY COLUMN status ENUM(${buildEnumSql(STATUS_VALUES)}) ${nullClause} DEFAULT '${safeDefault}'`
    );

    console.log("✅ Updated stay_bookings.status enum to include Rejected");
  } catch (error) {
    console.warn("⚠️ ensureStayBookingSchema skipped:", error.message);
  }
};
