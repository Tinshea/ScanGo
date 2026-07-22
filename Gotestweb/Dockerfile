# Étape 1 : build de l'application Go
#
# Le module cible Go 1.22 (cf. go.mod) pour rester compilable avec le
# toolchain installé en local ; l'image de build utilise une version plus
# récente, qui embarque moins de vulnérabilités connues.
FROM golang:1.24-alpine AS build

WORKDIR /app

# Les dépendances sont résolues avant la copie du code source : cette couche
# reste en cache tant que go.mod / go.sum ne changent pas.
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Les tests s'exécutent dans le build : une régression sur l'authentification
# ou le filtre de contenu bloque la production de l'image.
RUN go vet ./... && go test ./...

# Binaire statique, sans table de symboles ni informations de debug.
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/server .

# Étape 2 : image d'exécution minimale
FROM alpine:3.20

# ca-certificates est nécessaire aux appels HTTPS (MongoDB Atlas, MangaDex,
# Cloudinary). libc6-compat ne l'est pas : le binaire est statique.
RUN apk add --no-cache ca-certificates

# Exécution sans privilèges : le conteneur tournait auparavant en root.
RUN adduser -D -u 10001 scango
USER scango

WORKDIR /home/scango
COPY --from=build --chown=scango:scango /app/server ./server

EXPOSE 8080

CMD ["./server"]
