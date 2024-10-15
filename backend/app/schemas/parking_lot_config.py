from pydantic import BaseModel


class ParkingLotConfigCreate(BaseModel):
    total_car_spaces: int
    total_motorcycle_spaces: int


class ParkingLotConfigResponse(ParkingLotConfigCreate):
    id: int

    class Config:
        orm_mode = True

# Schema for parking lot statistics
class ParkingLotStats(BaseModel):
    total_spaces: int
    occupied_car_spaces: int
    occupied_motorcycle_spaces: int
    free_car_spaces: int
    free_motorcycle_spaces: int
    subscription_counts: dict
    percentages: dict

class ParkingLotStatsResponse(BaseModel):
    stats: ParkingLotStats