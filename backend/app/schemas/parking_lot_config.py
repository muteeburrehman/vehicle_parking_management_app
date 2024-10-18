from pydantic import BaseModel, validator


class ParkingLotCreate(BaseModel):
    name: str
    total_car_spaces: int
    total_motorcycle_spaces: int
    min_car_spaces: int
    min_motorcycle_spaces: int

    @validator('min_car_spaces')
    def validate_min_car_spaces(cls, v, values):
        if 'total_car_spaces' in values and v > values['total_car_spaces']:
            raise ValueError('Minimum car spaces cannot exceed total car spaces')
        return v

    @validator('min_motorcycle_spaces')
    def validate_min_motorcycle_spaces(cls, v, values):
        if 'total_motorcycle_spaces' in values and v > values['total_motorcycle_spaces']:
            raise ValueError('Minimum motorcycle spaces cannot exceed total motorcycle spaces')
        return v


class ParkingLotResponse(ParkingLotCreate):
    id: int

    class Config:
        orm_mode = True


class ParkingLotStats(BaseModel):
    free_car_spaces: int
    total_car_spaces: int
    free_motorcycle_spaces: int
    total_motorcycle_spaces: int
    status: str  # 'critical', 'warning', or 'good'


class ParkingLotStatsResponse(BaseModel):
    stats: ParkingLotStats