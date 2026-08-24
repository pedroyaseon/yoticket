"use client";

import { useMemo, useState } from "react";
import type { Venue } from "@/lib/movie";

const weekdays = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];
const defaultTimes = ["14:00", "18:00", "21:00"];

export function ScheduleFields({ venues }: { venues: Venue[] }) {
  const [startDate, setStartDate] = useState(() => localDateAfter(1));
  const [runDays, setRunDays] = useState(7);
  const [selectedWeekdays, setSelectedWeekdays] = useState(
    weekdays.map((day) => day.value),
  );
  const [times, setTimes] = useState(defaultTimes);
  const expectedCount = useMemo(
    () =>
      buildSchedule(startDate, runDays, selectedWeekdays, times, false).length,
    [runDays, selectedWeekdays, startDate, times],
  );

  function setSessionCount(count: number) {
    setTimes((current) =>
      Array.from(
        { length: count },
        (_, index) => current[index] ?? defaultTimes[index] ?? "12:00",
      ),
    );
  }

  return (
    <div className="mt-7 grid gap-6">
      <label htmlFor="location">
        <span className="mb-2 block text-sm text-[#bbb6ad]">Local</span>
        <input
          key={venues[0]?.name}
          required
          id="location"
          name="location"
          list="venue-options"
          defaultValue={venues[0]?.name}
          placeholder="Nome do cinema ou espaço"
          className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
        />
        <datalist id="venue-options">
          {venues.map((venue) => (
            <option key={venue.slug} value={venue.name} />
          ))}
        </datalist>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label htmlFor="startDate">
          <span className="mb-2 block text-sm text-[#bbb6ad]">
            Primeiro dia em cartaz
          </span>
          <input
            required
            id="startDate"
            name="startDate"
            type="date"
            min={localDateAfter(0)}
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
          />
        </label>
        <label htmlFor="runDays">
          <span className="mb-2 block text-sm text-[#bbb6ad]">
            Tempo em cartaz
          </span>
          <div className="flex items-center border border-[#39393e] bg-[#0b0b0c]">
            <input
              required
              id="runDays"
              name="runDays"
              type="number"
              min="1"
              max="30"
              value={runDays}
              onChange={(event) => setRunDays(Number(event.target.value))}
              className="min-w-0 flex-1 bg-transparent p-3.5 outline-none"
            />
            <span className="pr-4 text-sm text-[#77736d]">dias</span>
          </div>
        </label>
      </div>

      <fieldset>
        <legend className="text-sm text-[#bbb6ad]">Dias de exibição</legend>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {weekdays.map((day) => {
            const checked = selectedWeekdays.includes(day.value);
            return (
              <label
                key={day.value}
                className={`cursor-pointer border px-3 py-2.5 text-center text-sm ${
                  checked
                    ? "border-[#ff5c35] bg-[#ff5c35] text-black"
                    : "border-[#39393e] text-[#aaa59c] hover:border-[#77736d]"
                }`}
              >
                <input
                  type="checkbox"
                  name="weekdays"
                  value={day.value}
                  checked={checked}
                  onChange={() =>
                    setSelectedWeekdays((current) =>
                      checked
                        ? current.filter((value) => value !== day.value)
                        : [...current, day.value],
                    )
                  }
                  className="sr-only"
                />
                {day.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-[220px_minmax(0,1fr)]">
        <label htmlFor="sessionCount">
          <span className="mb-2 block text-sm text-[#bbb6ad]">
            Sessões por dia
          </span>
          <select
            id="sessionCount"
            value={times.length}
            onChange={(event) => setSessionCount(Number(event.target.value))}
            className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
          >
            {[1, 2, 3, 4].map((count) => (
              <option key={count} value={count}>
                {count} {count === 1 ? "sessão" : "sessões"}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend className="text-sm text-[#bbb6ad]">
            Horário de cada sessão
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {times.map((time, index) => (
              <label key={index}>
                <span className="sr-only">Horário {index + 1}</span>
                <input
                  required
                  type="time"
                  name="sessionTimes"
                  value={time}
                  onChange={(event) =>
                    setTimes((current) =>
                      current.map((value, timeIndex) =>
                        timeIndex === index ? event.target.value : value,
                      ),
                    )
                  }
                  className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
                />
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label htmlFor="capacity">
          <span className="mb-2 block text-sm text-[#bbb6ad]">Capacidade</span>
          <input
            required
            id="capacity"
            name="capacity"
            min="1"
            type="number"
            defaultValue="96"
            className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
          />
        </label>
        <label htmlFor="price">
          <span className="mb-2 block text-sm text-[#bbb6ad]">
            Inteira (R$)
          </span>
          <input
            required
            id="price"
            name="price"
            min="0"
            step="0.01"
            type="number"
            defaultValue="40.00"
            className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
          />
        </label>
      </div>

      <div className="border-l-2 border-[#ff5c35] bg-[#0f0f11] px-5 py-4">
        <p className="font-semibold">
          {expectedCount} {expectedCount === 1 ? "sessão" : "sessões"} serão
          criadas
        </p>
        <p className="mt-1 text-sm text-[#8f8a82]">
          O lote respeita o período, os dias escolhidos e todos os horários
          acima.
        </p>
      </div>
    </div>
  );
}

export function sessionStartsAtFrom(data: FormData) {
  const startDate = String(data.get("startDate"));
  const runDays = Number(data.get("runDays"));
  const selectedWeekdays = data
    .getAll("weekdays")
    .map((value) => Number(value));
  const times = data.getAll("sessionTimes").map(String);
  if (selectedWeekdays.length === 0)
    throw new Error("Escolha pelo menos um dia da semana.");
  if (new Set(times).size !== times.length)
    throw new Error("Os horários das sessões não podem se repetir.");
  const sessions = buildSchedule(
    startDate,
    runDays,
    selectedWeekdays,
    times,
    true,
  );
  if (sessions.length === 0)
    throw new Error("O período escolhido não contém sessões futuras.");
  return sessions;
}

function buildSchedule(
  startDate: string,
  runDays: number,
  selectedWeekdays: number[],
  times: string[],
  onlyFuture: boolean,
) {
  if (!startDate || !Number.isInteger(runDays) || runDays < 1 || runDays > 30)
    return [];
  const [year, month, day] = startDate.split("-").map(Number);
  if (!year || !month || !day) return [];
  const sessions: string[] = [];
  for (let offset = 0; offset < runDays; offset += 1) {
    const current = new Date(year, month - 1, day + offset);
    if (!selectedWeekdays.includes(current.getDay())) continue;
    for (const time of times) {
      if (!/^\d{2}:\d{2}$/.test(time)) continue;
      const [hour, minute] = time.split(":").map(Number);
      const startsAt = new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate(),
        hour,
        minute,
      );
      if (!onlyFuture || startsAt > new Date())
        sessions.push(startsAt.toISOString());
    }
  }
  return sessions;
}

function localDateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
