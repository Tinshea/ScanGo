# Étape 1 : Build l’application Go
FROM golang:1.23 AS build

WORKDIR /app

# Copier les fichiers go.mod et go.sum et récupérer les dépendances
COPY go.mod go.sum ./
RUN go mod download

# Copier tout le code source
COPY . .

# Compiler l'application en statique pour Linux AMD64
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app .

# Étape 2 : Utilisation d'une image légère
FROM alpine:latest
RUN apk add --no-cache ca-certificates

WORKDIR /root/

# Installer libc6-compat pour compatibilité avec les binaires Go
RUN apk add --no-cache libc6-compat

# Copier l'exécutable
COPY --from=build /app/app .

# Vérifier si l'exécutable existe et a les bonnes permissions
RUN ls -la /root/app && chmod +x /root/app

# Définir le port exposé
EXPOSE 8080

# Lancer l'application
CMD ["./app"]
