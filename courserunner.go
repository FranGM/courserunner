package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"text/template"

	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/kelseyhightower/envconfig"
)

var db *sql.DB

func base36Decode(num string) int64 {
	res, err := strconv.ParseInt(num, 36, 64)
	if err != nil {
		log.Fatal(err)
	}
	return res
}

func base36Encode(num int) string {
	alphabet := "0123456789abcdefghijklmnopqrstuvwxyz"

	var buf bytes.Buffer

	if num >= 0 && num < len(alphabet) {
		return string(alphabet[num])
	}

	for {
		mod := num % len(alphabet)
		num = num / len(alphabet)
		buf.WriteString(string(alphabet[mod]))
		if num == 0 {
			break
		}
	}
	return reverse(buf.String())
}

func reverse(input string) string {
	b := []byte(input)
	for i, j := 0, len(b)-1; i < j; i, j = i+1, j-1 {
		b[i], b[j] = b[j], b[i]
	}
	return string(b)
}

type course struct {
	id          int
	description string
}

type pageInfo struct {
	courseID string
}

func indexHandler(w http.ResponseWriter, r *http.Request) {
	t, _ := template.ParseFiles("templates/index.html")
	t.Execute(w, nil)
}

func coursePageHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	t, _ := template.ParseFiles("templates/index.html")
	t.Execute(w, vars["courseID"])
}

func course3dPageHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	t, _ := template.ParseFiles("templates/index3d.html")
	t.Execute(w, vars["courseID"])
}

func saveCourse(w http.ResponseWriter, r *http.Request) {
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(400)
		return
	}
	query := "INSERT INTO courses (description) VALUES ( ? )"
	res, err := db.Exec(query, string(body))
	if err != nil {
		w.WriteHeader(500)
		errPayload := errorPayload{Err: "Error saving course"}
		j, _ := json.Marshal(errPayload)
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, string(j))
		return
	}
	id, err := res.LastInsertId()
	if err != nil {
		w.WriteHeader(500)
		return
	}
	resPayload := responsePayload{Response: base36Encode(int(id))}
	j, err := json.Marshal(resPayload)
	if err != nil {
		w.WriteHeader(500)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, string(j))
}

type errorPayload struct {
	Err string `json:"error"`
}

type responsePayload struct {
	Response string `json:"response"`
}

func getCourse(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	decodedID := base36Decode(vars["courseID"])
	query := "SELECT description FROM courses WHERE id = ?"
	stmt, _ := db.Prepare(query)

	var description string
	err := stmt.QueryRow(decodedID).Scan(&description)
	if err != nil {
		if err == sql.ErrNoRows {
			w.WriteHeader(404)
		} else {
			w.WriteHeader(500)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, description)
}

type dbConfig struct {
	DBPort int
	DBUser string
	DBPass string
	DBHost string
	DBName string
}

var config dbConfig

func init() {

	config = dbConfig{DBPort: 3306, DBUser: "courserunner", DBPass: "courserunner", DBHost: "127.0.0.1", DBName: "courserunner"}
	envconfig.Process("courserunner", &config)
}

func main() {

	http.HandleFunc("/static/", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, r.URL.Path[1:])
	})

	r := mux.NewRouter()
	r.StrictSlash(true)
	r.HandleFunc("/", coursePageHandler).Methods("GET")
	r.HandleFunc("/course/{courseID}/", coursePageHandler).Methods("GET")
	r.HandleFunc("/3d/{courseID}/", course3dPageHandler).Methods("GET")
	r.HandleFunc("/courses/", saveCourse).Methods("POST")
	r.HandleFunc("/courses/{courseID}/", getCourse).Methods("GET")

	http.Handle("/", r)

	var err error

	// TODO: Make configurable
	dbdsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true", config.DBUser, config.DBPass, config.DBHost, config.DBPort, config.DBName)
	db, err = sql.Open("mysql", dbdsn)
	if err != nil {
		log.Fatal(err)
	}

	// Pinging to see the db is alive
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	stmt := "CREATE TABLE IF NOT EXISTS courses (`id` int(11) NOT NULL AUTO_INCREMENT, `description` text, PRIMARY KEY (`id`) )"
	_, err = db.Exec(stmt)
	if err != nil {
		log.Fatal(err)
	}

	http.ListenAndServe(":8080", nil)
}
