@echo off
rem =====================================================================
rem  EduGest Pro - Ouvrir le port 8000 dans le Pare-feu Windows
rem  A EXECUTER EN ADMINISTRATEUR (clic droit > "Executer en tant
rem  qu'administrateur") pour permettre l'acces depuis les autres postes.
rem =====================================================================
echo.
echo Ouverture du port 8000 dans le pare-feu...
netsh advfirewall firewall delete rule name="EduGest8000" >nul 2>&1
netsh advfirewall firewall add rule name="EduGest8000" dir=in action=allow protocol=TCP localport=8000
echo.
echo Termine. Les autres postes pourront acceder via http://IP-DU-SERVEUR:8000
echo (ex: http://192.168.10.10:8000)
echo.
pause