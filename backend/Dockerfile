FROM python:3.10

WORKDIR /

COPY requirements.txt /
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY . /backend

EXPOSE 8000
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/

CMD ["python", "/backend/app/main.py"]
