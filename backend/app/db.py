import json
import random
from datetime import date, timedelta
from typing import Optional

from sqlmodel import Field, Session, SQLModel, create_engine, select

from .catalog import MEDICINES, PHCS

BASE = {m[0]: m[6] for m in MEDICINES}
LOAD = {p[0]: p[5] for p in PHCS}
from .config import DB_PATH

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


class Medicine(SQLModel, table=True):
    code: str = Field(primary_key=True)
    name: str
    strength: str
    form: str
    unit: str
    aliases: str  # json list
    base_daily_issue: int


class PHC(SQLModel, table=True):
    id: str = Field(primary_key=True)
    name: str
    block: str
    district: str
    state: str
    load: float


class DvdmsStock(SQLModel, table=True):
    """What DVDMS *currently believes* is on the shelf (mock)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    phc_id: str = Field(index=True)
    med_code: str = Field(index=True)
    batch: str
    expiry: str  # YYYY-MM
    qty: int


class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    phc_id: str
    created: str
    summary: str  # json


def get_session():
    with Session(engine) as s:
        yield s


def _batch_code(rng: random.Random) -> str:
    return f"{rng.choice('ABCDEFGHJKLMNPRSTUVW')}{rng.choice('ABCDEFGHJKLMNPRSTUVW')}{rng.randint(1000, 9999)}"


def _override_from_answer_keys(s: Session, rng: random.Random):
    """Make mock DVDMS believable against the synthetic sample pages: for each PHC/medicine that
    appears in an answer key, DVDMS 'believes' a stock that is mostly right for some lines and
    badly overstated (phantom stock) for others."""
    from .config import ROOT
    ans_dir = ROOT / "samples" / "answers"
    if not ans_dir.exists():
        return
    done = {}
    for f in sorted(ans_dir.glob("*.json")):
        data = json.loads(f.read_text(encoding="utf-8"))
        for r in data["rows"]:
            k = (data["phc_id"], r["med_code"])
            if k in done:
                # another page of the same centre lists a different batch of this medicine:
                # DVDMS knows that batch too (used up, quantity 0)
                if r["batch"] not in done[k]:
                    done[k].add(r["batch"])
                    s.add(DvdmsStock(phc_id=k[0], med_code=k[1], batch=r["batch"], expiry=r["expiry"], qty=0))
                continue
            done[k] = {r["batch"]}
            for old in s.exec(select(DvdmsStock).where(DvdmsStock.phc_id == k[0], DvdmsStock.med_code == k[1])).all():
                s.delete(old)
            factor = rng.uniform(1.0, 1.25) if rng.random() < 0.55 else rng.uniform(1.8, 9.0)
            daily = max(1, round(BASE[k[1]] * LOAD[k[0]]))
            s.add(DvdmsStock(phc_id=k[0], med_code=k[1], batch=r["batch"], expiry=r["expiry"],
                             qty=int(min(r["closing"] * factor, daily * 75))))  # DVDMS never claims more than ~75 days
    s.commit()


def seed(force: bool = False):
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        if s.exec(select(Medicine)).first() and not force:
            return
        if force:
            for model in (DvdmsStock, PHC, Medicine, Submission):
                for row in s.exec(select(model)).all():
                    s.delete(row)
            s.commit()
        rng = random.Random(2026)
        for code, name, strength, form, unit, aliases, base in MEDICINES:
            s.add(Medicine(code=code, name=name, strength=strength, form=form, unit=unit,
                           aliases=json.dumps(aliases, ensure_ascii=False), base_daily_issue=base))
        for pid, name, block, district, state, load in PHCS:
            s.add(PHC(id=pid, name=name, block=block, district=district, state=state, load=load))
        today = date.today()
        for pid, *_rest, load in PHCS:
            for code, name, strength, form, unit, aliases, base in MEDICINES:
                daily = max(1, round(base * load))
                # DVDMS is over-optimistic: it lags behind real consumption
                days_believed = rng.randint(18, 60)
                for _ in range(rng.choice([1, 1, 2])):
                    exp = today + timedelta(days=rng.randint(40, 700))
                    s.add(DvdmsStock(phc_id=pid, med_code=code, batch=_batch_code(rng),
                                     expiry=exp.strftime("%Y-%m"),
                                     qty=int(daily * days_believed / 1.5) + rng.randint(0, 40)))
        s.commit()
        _override_from_answer_keys(s, rng)
