import { cn } from "./utils";

describe("cn", () => {
  it("menggabungkan beberapa class", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("mengabaikan nilai falsy (undefined/false/null)", () => {
    expect(cn("a", undefined, false, null, "b")).toBe("a b");
  });

  it("menyelesaikan konflik Tailwind (kelas terakhir menang)", () => {
    // tailwind-merge: p-4 kalah oleh p-2
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("mendukung conditional object (clsx)", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
