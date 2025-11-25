FROM python:3.10

WORKDIR /backend

COPY requirements.txt /backend/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . /backend

EXPOSE 8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/backend

CMD ["python", "/backend/app/main.py"]
