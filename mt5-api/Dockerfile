FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV USE_MOCK_DATA=true
ENV PORT=8000

EXPOSE 8000

CMD ["python", "main.py"]
