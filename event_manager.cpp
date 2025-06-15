#include <iostream>
#include <fstream>
#include <vector>
#include <string>
#include <sstream>
using namespace std;

// Structure for Event
struct Event {
    string name;
    string date;
    string time;
    string description;
};

// Function to load all events from file
vector<Event> loadEvents(const string &filename) {
    ifstream file(filename);
    vector<Event> events;
    string line;

    while (getline(file, line)) {
        stringstream ss(line);
        string name, date, time, desc;

        if (getline(ss, name, '|') &&
            getline(ss, date, '|') &&
            getline(ss, time, '|') &&
            getline(ss, desc)) {
            events.push_back({name, date, time, desc});
        }
    }

    return events;
}

// Function to save all events to file
void saveEvents(const vector<Event> &events, const string &filename) {
    ofstream file(filename);
    for (const auto &e : events) {
        file << e.name << '|' << e.date << '|' << e.time << '|' << e.description << '\n';
    }
}

// Function to add a single event
void addEvent() {
    Event e;
    cout << "Enter event name: ";
    getline(cin, e.name);
    cout << "Enter date (YYYY-MM-DD): ";
    getline(cin, e.date);
    cout << "Enter time (HH:MM): ";
    getline(cin, e.time);
    cout << "Enter description: ";
    getline(cin, e.description);

    ofstream file("events.txt", ios::app);
    file << e.name << '|' << e.date << '|' << e.time << '|' << e.description << '\n';
    cout << "Event added successfully.\n";
}

// Function to remove an event by name
void removeEvent() {
    string nameToRemove;
    cout << "Enter the exact event name to remove: ";
    getline(cin, nameToRemove);

    vector<Event> events = loadEvents("events.txt");
    bool found = false;

    vector<Event> updatedEvents;
    for (const auto &e : events) {
        if (e.name != nameToRemove) {
            updatedEvents.push_back(e);
        } else {
            found = true;
        }
    }

    if (found) {
        saveEvents(updatedEvents, "events.txt");
        cout << "🗑️ Event removed successfully.\n";
    } else {
        cout << "⚠️ Event not found.\n";
    }
}

void sendNotification() {
    string message;
    cout << "Enter notification message: ";
    getline(cin, message);

    ofstream file("notifications.txt", ios::app);
    file << message << '\n';
    cout << "📢 Notification sent successfully.\n";
}

int main() {
    int choice;
    do {
        cout << "\n--- Event Manager ---\n";
        cout << "1. Add Event\n";
        cout << "2. Remove Event\n";
        cout << "3. Send Notification\n";
        cout << "4. Exit\n";
        cout << "Enter your choice: ";
        cin >> choice;
        cin.ignore();  // clear input buffer

        switch (choice) {
            case 1:
                addEvent();
                break;
            case 2:
                removeEvent();
                break;
            case 3:
                sendNotification();
                break;
            case 4:
                cout << "Exiting...\n";
                break;
            default:
                cout << "Invalid choice. Try again.\n";
        }
    } while (choice != 4);

    return 0;
}
